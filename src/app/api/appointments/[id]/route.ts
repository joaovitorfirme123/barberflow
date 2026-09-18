import { z } from "zod";

import { assertSameOrigin, errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/tenant";
import { trackProductEvent } from "@/lib/product-events";

const schema = z.object({
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

const allowedTransitions = {
  SCHEDULED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
} as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireManager();
    const { id } = await params;
    const input = schema.parse(await request.json());
    const appointment = await prisma.appointment.findFirst({
      where: { id, barbershopId: user.barbershopId },
      select: { status: true },
    });
    if (!appointment) throw new HttpError(404, "Agendamento não encontrado.");
    if (appointment.status === input.status) return ok({ status: appointment.status });
    const allowed = allowedTransitions[appointment.status] as readonly string[];
    if (!allowed.includes(input.status)) {
      throw new HttpError(409, "Essa alteração de status não é permitida.");
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: input.status },
      select: { status: true },
    });
    if (updated.status === "COMPLETED") {
      await trackProductEvent("APPOINTMENT_COMPLETED", user.barbershopId);
    } else if (updated.status === "NO_SHOW") {
      await trackProductEvent("NO_SHOW_RECORDED", user.barbershopId);
    }
    return ok(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

import { z } from "zod";

import { errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/tenant";

const schema = z.object({
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireManager();
    const { id } = await params;
    const input = schema.parse(await request.json());
    const result = await prisma.appointment.updateMany({
      where: { id, barbershopId: user.barbershopId },
      data: { status: input.status },
    });
    if (!result.count) throw new HttpError(404, "Agendamento não encontrado.");
    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

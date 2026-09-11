import { z } from "zod";

import { errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/tenant";

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().min(0).max(100000).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireManager();
    const { id } = await params;
    const input = serviceSchema.parse(await request.json());
    const service = await prisma.service.updateMany({
      where: { id, barbershopId: user.barbershopId },
      data: input,
    });
    if (!service.count) throw new HttpError(404, "Serviço não encontrado.");
    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireManager();
    const { id } = await params;
    const service = await prisma.service.updateMany({
      where: { id, barbershopId: user.barbershopId },
      data: { active: false },
    });
    if (!service.count) throw new HttpError(404, "Serviço não encontrado.");
    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

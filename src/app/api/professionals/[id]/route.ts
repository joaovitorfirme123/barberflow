import { z } from "zod";

import { errorResponse, HttpError, ok } from "@/lib/http";
import { idSchema } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { requireManager } from "@/lib/tenant";

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  photoUrl: z.string().trim().url().nullable().optional(),
  active: z.boolean().optional(),
  serviceIds: z.array(idSchema).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireManager();
    const { id } = await params;
    const input = schema.parse(await request.json());
    const professional = await prisma.professional.findFirst({
      where: { id, barbershopId: user.barbershopId },
    });
    if (!professional) throw new HttpError(404, "Profissional não encontrado.");

    if (input.serviceIds) {
      const services = await prisma.service.findMany({
        where: { id: { in: input.serviceIds }, barbershopId: user.barbershopId },
        select: { id: true },
      });
      if (services.length !== input.serviceIds.length) {
        throw new HttpError(400, "Serviço inválido para esta barbearia.");
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.professional.update({
        where: { id },
        data: { name: input.name, photoUrl: input.photoUrl, active: input.active },
      });
      if (input.serviceIds) {
        await tx.professionalService.deleteMany({ where: { professionalId: id } });
        await tx.professionalService.createMany({
          data: input.serviceIds.map((serviceId) => ({ professionalId: id, serviceId })),
        });
      }
    });

    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireManager();
    const { id } = await params;
    const result = await prisma.professional.updateMany({
      where: { id, barbershopId: user.barbershopId },
      data: { active: false },
    });
    if (!result.count) throw new HttpError(404, "Profissional não encontrado.");
    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

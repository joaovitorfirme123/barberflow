import { z } from "zod";

import { errorResponse, HttpError, ok } from "@/lib/http";
import { idSchema } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { requireManager, requireUser } from "@/lib/tenant";

const schema = z.object({
  professionalId: idSchema.nullable().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  reason: z.string().trim().max(200).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const startsAt = searchParams.get("startsAt");
    const endsAt = searchParams.get("endsAt");
    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        barbershopId: user.barbershopId,
        ...(startsAt && endsAt
          ? { startsAt: { lt: new Date(endsAt) }, endsAt: { gt: new Date(startsAt) } }
          : {}),
      },
      orderBy: { startsAt: "asc" },
    });
    return ok({ blocks });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireManager();
    const input = schema.parse(await request.json());
    if (input.endsAt <= input.startsAt) throw new HttpError(400, "Intervalo de bloqueio inválido.");

    if (input.professionalId) {
      const professional = await prisma.professional.findFirst({
        where: { id: input.professionalId, barbershopId: user.barbershopId },
      });
      if (!professional) throw new HttpError(404, "Profissional não encontrado.");
    }

    const block = await prisma.scheduleBlock.create({
      data: { ...input, barbershopId: user.barbershopId },
    });
    return ok({ block }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

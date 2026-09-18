import { z } from "zod";

import { lockTenantCalendar } from "@/lib/booking";
import { localDateTimeToUtc } from "@/lib/dates";
import { assertSameOrigin, errorResponse, HttpError, ok } from "@/lib/http";
import { idSchema } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { requireManager, requireUser } from "@/lib/tenant";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.object({
  professionalId: idSchema.nullable().optional(),
  startDate: date,
  startTime: time,
  endDate: date,
  endTime: time,
  reason: z.string().trim().max(200).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const startsAtParam = searchParams.get("startsAt");
    const endsAtParam = searchParams.get("endsAt");
    if (Boolean(startsAtParam) !== Boolean(endsAtParam)) {
      throw new HttpError(400, "Informe o início e o fim do período.");
    }
    const startsAt = startsAtParam ? new Date(startsAtParam) : new Date();
    const endsAt = endsAtParam
      ? new Date(endsAtParam)
      : new Date(startsAt.getTime() + 366 * 24 * 60 * 60_000);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      throw new HttpError(400, "Período de consulta inválido.");
    }
    const blocks = await prisma.scheduleBlock.findMany({
      where: {
        barbershopId: user.barbershopId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
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
    assertSameOrigin(request);
    const user = await requireManager();
    const input = schema.parse(await request.json());
    const startsAt = localDateTimeToUtc(input.startDate, input.startTime, user.barbershop.timezone);
    const endsAt = localDateTimeToUtc(input.endDate, input.endTime, user.barbershop.timezone);
    if (endsAt <= startsAt) throw new HttpError(400, "Intervalo de bloqueio inválido.");

    if (input.professionalId) {
      const professional = await prisma.professional.findFirst({
        where: { id: input.professionalId, barbershopId: user.barbershopId },
      });
      if (!professional) throw new HttpError(404, "Profissional não encontrado.");
    }

    const block = await prisma.$transaction(async (tx) => {
      await lockTenantCalendar(tx, user.barbershopId);
      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          barbershopId: user.barbershopId,
          ...(input.professionalId ? { professionalId: input.professionalId } : {}),
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
        select: { id: true },
      });
      if (conflictingAppointment) {
        throw new HttpError(409, "Existe um agendamento ativo nesse intervalo.");
      }

      return tx.scheduleBlock.create({
        data: {
          barbershopId: user.barbershopId,
          professionalId: input.professionalId,
          startsAt,
          endsAt,
          reason: input.reason,
        },
      });
    });
    return ok({ block }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

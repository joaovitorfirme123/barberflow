import { z } from "zod";

import { assertSameOrigin, errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireManager, requireUser } from "@/lib/tenant";
import { refreshOnboardingStatus } from "@/lib/product-events";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const hourSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  openTime: time,
  closeTime: time,
  breakStart: time.nullable().optional(),
  breakEnd: time.nullable().optional(),
  closed: z.boolean(),
});
const schema = z.object({ hours: z.array(hourSchema).length(7) });

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function validateHours(hours: z.infer<typeof schema>["hours"]) {
  const weekdays = new Set(hours.map((hour) => hour.weekday));
  if (weekdays.size !== 7) throw new HttpError(400, "É necessário configurar os 7 dias da semana");

  for (const hour of hours) {
    if (hour.closed) continue;
    if (minutes(hour.closeTime) <= minutes(hour.openTime)) {
      throw new HttpError(400, "O fechamento deve ser depois da abertura");
    }
    if ((hour.breakStart && !hour.breakEnd) || (!hour.breakStart && hour.breakEnd)) {
      throw new HttpError(400, "O intervalo precisa de início e fim");
    }
    if (hour.breakStart && hour.breakEnd) {
      if (
        minutes(hour.breakStart) < minutes(hour.openTime) ||
        minutes(hour.breakEnd) > minutes(hour.closeTime) ||
        minutes(hour.breakEnd) <= minutes(hour.breakStart)
      ) {
        throw new HttpError(400, "Intervalo fora do horário de funcionamento");
      }
    }
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const hours = await prisma.businessHour.findMany({
      where: { barbershopId: user.barbershopId },
      orderBy: { weekday: "asc" },
    });
    return ok({ hours });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireManager();
    const input = schema.parse(await request.json());
    validateHours(input.hours);

    await prisma.$transaction(
      input.hours.map((hour) =>
        prisma.businessHour.upsert({
          where: {
            barbershopId_weekday: { barbershopId: user.barbershopId, weekday: hour.weekday },
          },
          update: hour,
          create: { ...hour, barbershopId: user.barbershopId },
        }),
      ),
    );

    const hours = await prisma.businessHour.findMany({
      where: { barbershopId: user.barbershopId },
      orderBy: { weekday: "asc" },
    });
    await refreshOnboardingStatus(user.barbershopId);
    return ok({ hours });
  } catch (error) {
    return errorResponse(error);
  }
}

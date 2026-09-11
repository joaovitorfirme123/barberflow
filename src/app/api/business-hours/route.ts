import { z } from "zod";

import { errorResponse, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireManager, requireUser } from "@/lib/tenant";

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
  if (weekdays.size !== 7) throw new Error("É necessário configurar os 7 dias da semana");

  for (const hour of hours) {
    if (hour.closed) continue;
    if (minutes(hour.closeTime) <= minutes(hour.openTime)) {
      throw new Error("O fechamento deve ser depois da abertura");
    }
    if ((hour.breakStart && !hour.breakEnd) || (!hour.breakStart && hour.breakEnd)) {
      throw new Error("O intervalo precisa de início e fim");
    }
    if (hour.breakStart && hour.breakEnd) {
      if (
        minutes(hour.breakStart) < minutes(hour.openTime) ||
        minutes(hour.breakEnd) > minutes(hour.closeTime) ||
        minutes(hour.breakEnd) <= minutes(hour.breakStart)
      ) {
        throw new Error("Intervalo fora do horário de funcionamento");
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
    return ok({ hours });
  } catch (error) {
    return errorResponse(error);
  }
}

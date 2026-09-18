import {
  calendarDateInTimeZone,
  localDateTimeToUtc,
  addCalendarDays,
  parseCalendarDate,
} from "@/lib/dates";
import { errorResponse, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const today = calendarDateInTimeZone(new Date(), user.barbershop.timezone);
    const date = new URL(request.url).searchParams.get("date") ?? today;
    parseCalendarDate(date);
    const startsAt = localDateTimeToUtc(date, "00:00", user.barbershop.timezone);
    const endsAt = localDateTimeToUtc(addCalendarDays(date, 1), "00:00", user.barbershop.timezone);
    const [appointments, serviceCount, professionalCount, businessHourCount] = await Promise.all([
      prisma.appointment.findMany({
        where: { barbershopId: user.barbershopId, startsAt: { gte: startsAt, lt: endsAt } },
        include: { service: true, professional: true, customer: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.service.count({ where: { barbershopId: user.barbershopId, active: true } }),
      prisma.professional.count({
        where: {
          barbershopId: user.barbershopId,
          active: true,
          services: { some: { service: { active: true } } },
        },
      }),
      prisma.businessHour.count({ where: { barbershopId: user.barbershopId } }),
    ]);

    return ok({
      date,
      today,
      totalToday: appointments.filter((appointment) => appointment.status !== "CANCELLED").length,
      estimatedRevenue: appointments
        .filter((appointment) =>
          ["SCHEDULED", "CONFIRMED", "COMPLETED"].includes(appointment.status),
        )
        .reduce((total, appointment) => total + Number(appointment.service.price), 0),
      appointments,
      onboarding: {
        service: serviceCount > 0,
        professional: professionalCount > 0,
        hours: businessHourCount === 7,
        contact: Boolean(user.barbershop.phone),
        publicPage: serviceCount > 0 && professionalCount > 0 && businessHourCount === 7,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

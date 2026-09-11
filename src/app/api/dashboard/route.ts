import { calendarDateInTimeZone, localDateTimeToUtc, addCalendarDays } from "@/lib/dates";
import { errorResponse, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";

export async function GET() {
  try {
    const user = await requireUser();
    const today = calendarDateInTimeZone(new Date(), user.barbershop.timezone);
    const startsAt = localDateTimeToUtc(today, "00:00", user.barbershop.timezone);
    const endsAt = localDateTimeToUtc(addCalendarDays(today, 1), "00:00", user.barbershop.timezone);
    const [appointments, upcoming] = await Promise.all([
      prisma.appointment.findMany({
        where: { barbershopId: user.barbershopId, startsAt: { gte: startsAt, lt: endsAt } },
        include: { service: true, professional: true, customer: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.appointment.findMany({
        where: {
          barbershopId: user.barbershopId,
          startsAt: { gte: new Date() },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        include: { service: true, professional: true, customer: true },
        orderBy: { startsAt: "asc" },
        take: 5,
      }),
    ]);

    return ok({
      date: today,
      totalToday: appointments.length,
      estimatedRevenue: appointments
        .filter((appointment) => appointment.status !== "CANCELLED")
        .reduce((total, appointment) => total + Number(appointment.service.price), 0),
      appointments,
      upcoming,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

import type { Prisma } from "@prisma/client";

import { calculateAvailableSlots, slotEnd } from "@/lib/availability";
import { addCalendarDays, localDateTimeToUtc, parseCalendarDate } from "@/lib/dates";
import { HttpError } from "@/lib/http";

type CalendarDatabase = Pick<
  Prisma.TransactionClient,
  "appointment" | "businessHour" | "professional" | "scheduleBlock" | "service"
>;

type BookingBarbershop = {
  id: string;
  timezone: string;
  minBookingNoticeMinutes: number;
  maxBookingDays: number;
  slotIntervalMinutes: number;
  slotMode: "FIXED" | "FLEXIBLE";
};

type BookingSelection = {
  serviceId: string;
  professionalId: string;
  date: string;
};

export async function lockTenantCalendar(tx: Prisma.TransactionClient, barbershopId: string) {
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${barbershopId}, 0)) IS NULL AS "locked"
  `;
}

export async function getAvailableSlots(
  db: CalendarDatabase,
  barbershop: BookingBarbershop,
  selection: BookingSelection,
) {
  const parsedDate = parseCalendarDate(selection.date);
  const [service, professional] = await Promise.all([
    db.service.findFirst({
      where: {
        id: selection.serviceId,
        barbershopId: barbershop.id,
        active: true,
        professionals: { some: { professionalId: selection.professionalId } },
      },
    }),
    db.professional.findFirst({
      where: {
        id: selection.professionalId,
        barbershopId: barbershop.id,
        active: true,
      },
    }),
  ]);
  if (!service || !professional) {
    throw new HttpError(400, "Serviço ou profissional indisponível.");
  }

  const dayStart = localDateTimeToUtc(selection.date, "00:00", barbershop.timezone);
  const dayEnd = localDateTimeToUtc(
    addCalendarDays(selection.date, 1),
    "00:00",
    barbershop.timezone,
  );
  const [businessHour, appointments, blocks] = await Promise.all([
    db.businessHour.findUnique({
      where: {
        barbershopId_weekday: {
          barbershopId: barbershop.id,
          weekday: parsedDate.getUTCDay(),
        },
      },
    }),
    db.appointment.findMany({
      where: {
        barbershopId: barbershop.id,
        professionalId: professional.id,
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      select: { startsAt: true, endsAt: true },
    }),
    db.scheduleBlock.findMany({
      where: {
        barbershopId: barbershop.id,
        OR: [{ professionalId: null }, { professionalId: professional.id }],
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  return {
    service,
    professional,
    slots: calculateAvailableSlots({
      date: selection.date,
      timeZone: barbershop.timezone,
      businessHour: businessHour ?? undefined,
      durationMinutes: service.durationMinutes,
      slotIntervalMinutes: barbershop.slotIntervalMinutes,
      slotMode: barbershop.slotMode,
      minBookingNoticeMinutes: barbershop.minBookingNoticeMinutes,
      maxBookingDays: barbershop.maxBookingDays,
      appointments,
      blocks,
    }),
  };
}

export async function resolveBookableSlot(
  db: CalendarDatabase,
  barbershop: BookingBarbershop,
  selection: BookingSelection & { time: string },
) {
  const availability = await getAvailableSlots(db, barbershop, selection);
  const startsAt = localDateTimeToUtc(selection.date, selection.time, barbershop.timezone);
  if (!availability.slots.includes(startsAt.toISOString())) {
    throw new HttpError(409, "Esse horário não está mais disponível.");
  }

  return {
    service: availability.service,
    professional: availability.professional,
    startsAt,
    endsAt: slotEnd(startsAt, availability.service.durationMinutes),
  };
}

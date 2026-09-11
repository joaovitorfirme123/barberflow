import {
  calendarDateInTimeZone,
  addCalendarDays,
  localDateTimeToUtc,
  parseCalendarDate,
  timeToMinutes,
  weekdayInTimeZone,
} from "./dates";

type BusinessHour = {
  weekday: number;
  openTime: string;
  closeTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  closed: boolean;
};

type BusyInterval = {
  startsAt: Date;
  endsAt: Date;
};

export type AvailabilityInput = {
  date: string;
  timeZone: string;
  businessHour?: BusinessHour;
  durationMinutes: number;
  slotIntervalMinutes: number;
  minBookingNoticeMinutes: number;
  maxBookingDays: number;
  appointments: BusyInterval[];
  blocks: BusyInterval[];
  now?: Date;
};

function overlaps(start: Date, end: Date, interval: BusyInterval) {
  return interval.startsAt < end && interval.endsAt > start;
}

export function validateBookingDate(
  date: string,
  timeZone: string,
  minBookingNoticeMinutes: number,
  maxBookingDays: number,
  now = new Date(),
) {
  parseCalendarDate(date);
  const today = calendarDateInTimeZone(now, timeZone);
  const minimumDate = parseCalendarDate(today).getTime();
  const requestedDate = parseCalendarDate(date).getTime();
  const maximumDate = parseCalendarDate(addCalendarDays(today, maxBookingDays)).getTime();

  if (requestedDate < minimumDate || requestedDate > maximumDate) {
    throw new Error("Data fora do período disponível para agendamento");
  }

  return new Date(now.getTime() + minBookingNoticeMinutes * 60_000);
}

export function calculateAvailableSlots(input: AvailabilityInput) {
  const {
    date,
    timeZone,
    businessHour,
    durationMinutes,
    slotIntervalMinutes,
    minBookingNoticeMinutes,
    maxBookingDays,
    appointments,
    blocks,
    now = new Date(),
  } = input;

  const minimumStart = validateBookingDate(
    date,
    timeZone,
    minBookingNoticeMinutes,
    maxBookingDays,
    now,
  );
  if (!businessHour || businessHour.closed) return [];

  const dayReference = new Date(`${date}T12:00:00.000Z`);
  if (weekdayInTimeZone(dayReference, timeZone) !== businessHour.weekday) return [];

  const openAt = localDateTimeToUtc(date, businessHour.openTime, timeZone);
  const closeAt = localDateTimeToUtc(date, businessHour.closeTime, timeZone);
  const breakStart = businessHour.breakStart
    ? localDateTimeToUtc(date, businessHour.breakStart, timeZone)
    : null;
  const breakEnd = businessHour.breakEnd
    ? localDateTimeToUtc(date, businessHour.breakEnd, timeZone)
    : null;
  const slots: string[] = [];
  const slotStart = new Date(openAt);
  const duration = durationMinutes * 60_000;

  while (slotStart.getTime() + duration <= closeAt.getTime()) {
    const slotEnd = new Date(slotStart.getTime() + duration);
    const inBreak = breakStart && breakEnd && slotStart < breakEnd && slotEnd > breakStart;
    const busy = appointments.some((appointment) => overlaps(slotStart, slotEnd, appointment));
    const blocked = blocks.some((block) => overlaps(slotStart, slotEnd, block));

    if (!inBreak && !busy && !blocked && slotStart >= minimumStart) {
      slots.push(slotStart.toISOString());
    }

    slotStart.setUTCMinutes(slotStart.getUTCMinutes() + slotIntervalMinutes);
  }

  return slots;
}

export function slotEnd(start: Date, durationMinutes: number) {
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export function validateTimeRange(startTime: string, endTime: string) {
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    throw new Error("O horário final deve ser depois do inicial");
  }
}

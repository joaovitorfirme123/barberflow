export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

function timeZoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]),
  ) as Record<string, number>;
}

export function assertValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
  } catch {
    throw new Error(`Timezone inválido: ${timeZone}`);
  }
}

export function parseCalendarDate(value: string) {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error("Data deve estar no formato YYYY-MM-DD");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Data inválida");
  }

  return date;
}

export function addCalendarDays(value: string, days: number) {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function timeToMinutes(value: string) {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new Error("Horário deve estar no formato HH:mm");

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error("Horário inválido");

  return hours * 60 + minutes;
}

function timeZoneOffset(date: Date, timeZone: string) {
  const parts = timeZoneParts(date, timeZone);
  return (
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) -
    date.getTime()
  );
}

export function localDateTimeToUtc(date: string, time: string, timeZone: string) {
  parseCalendarDate(date);
  timeToMinutes(time);
  assertValidTimeZone(timeZone);

  const localAsUtc = new Date(`${date}T${time}:00.000Z`);
  const firstGuess = new Date(localAsUtc.getTime() - timeZoneOffset(localAsUtc, timeZone));
  const finalGuess = new Date(localAsUtc.getTime() - timeZoneOffset(firstGuess, timeZone));

  return finalGuess;
}

export function formatInTimeZone(date: Date, timeZone: string) {
  assertValidTimeZone(timeZone);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function calendarDateInTimeZone(date: Date, timeZone: string) {
  assertValidTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function weekdayInTimeZone(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

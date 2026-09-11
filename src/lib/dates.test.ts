import { describe, expect, it } from "vitest";

import {
  formatInTimeZone,
  localDateTimeToUtc,
  parseCalendarDate,
  timeToMinutes,
  weekdayInTimeZone,
} from "./dates";

describe("date rules", () => {
  it("converts a local Sao Paulo time to UTC", () => {
    expect(localDateTimeToUtc("2026-01-15", "09:00", "America/Sao_Paulo").toISOString()).toBe(
      "2026-01-15T12:00:00.000Z",
    );
  });

  it("rejects invalid calendar dates and times", () => {
    expect(() => parseCalendarDate("2026-02-30")).toThrow("Data inválida");
    expect(() => timeToMinutes("24:00")).toThrow("Horário inválido");
  });

  it("uses the configured timezone when formatting and finding weekdays", () => {
    const date = new Date("2026-01-15T02:00:00.000Z");
    expect(formatInTimeZone(date, "America/Sao_Paulo")).toContain("14/01/2026");
    expect(weekdayInTimeZone(date, "America/Sao_Paulo")).toBe(3);
  });
});

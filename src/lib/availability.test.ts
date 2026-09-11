import { describe, expect, it } from "vitest";

import { calculateAvailableSlots } from "./availability";

describe("calculateAvailableSlots", () => {
  const base = {
    date: "2026-01-15",
    timeZone: "America/Sao_Paulo",
    businessHour: {
      weekday: 4,
      openTime: "09:00",
      closeTime: "16:00",
      breakStart: null,
      breakEnd: null,
      closed: false,
    },
    durationMinutes: 60,
    slotIntervalMinutes: 30,
    minBookingNoticeMinutes: 0,
    maxBookingDays: 60,
    appointments: [],
    blocks: [],
    now: new Date("2026-01-14T12:00:00.000Z"),
  };

  it("creates slots according to opening hours and duration", () => {
    expect(calculateAvailableSlots(base)).toEqual([
      "2026-01-15T12:00:00.000Z",
      "2026-01-15T12:30:00.000Z",
      "2026-01-15T13:00:00.000Z",
      "2026-01-15T13:30:00.000Z",
      "2026-01-15T14:00:00.000Z",
      "2026-01-15T14:30:00.000Z",
      "2026-01-15T15:00:00.000Z",
      "2026-01-15T15:30:00.000Z",
      "2026-01-15T16:00:00.000Z",
      "2026-01-15T16:30:00.000Z",
      "2026-01-15T17:00:00.000Z",
      "2026-01-15T17:30:00.000Z",
      "2026-01-15T18:00:00.000Z",
    ]);
  });

  it("removes appointments, blocks and intervals", () => {
    expect(
      calculateAvailableSlots({
        ...base,
        businessHour: { ...base.businessHour, breakStart: "10:00", breakEnd: "11:00" },
        appointments: [
          {
            startsAt: new Date("2026-01-15T14:00:00.000Z"),
            endsAt: new Date("2026-01-15T15:00:00.000Z"),
          },
        ],
        blocks: [
          {
            startsAt: new Date("2026-01-15T17:00:00.000Z"),
            endsAt: new Date("2026-01-15T18:00:00.000Z"),
          },
        ],
      }),
    ).toEqual([
      "2026-01-15T12:00:00.000Z",
      "2026-01-15T15:00:00.000Z",
      "2026-01-15T15:30:00.000Z",
      "2026-01-15T16:00:00.000Z",
      "2026-01-15T18:00:00.000Z",
    ]);
  });
});

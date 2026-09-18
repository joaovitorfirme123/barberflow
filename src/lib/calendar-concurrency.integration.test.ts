import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { lockTenantCalendar } from "./booking";
import { prisma } from "./prisma";
import { enforceRateLimit } from "./rate-limit";

const databaseTest = process.env.RUN_DATABASE_TESTS === "1" ? describe : describe.skip;

databaseTest("calendar concurrency with PostgreSQL", () => {
  let barbershopId: string;
  let professionalId: string;
  let serviceId: string;
  let firstCustomerId: string;
  let secondCustomerId: string;

  beforeAll(async () => {
    const shop = await prisma.barbershop.create({
      data: {
        name: "Concurrency test",
        slug: `concurrency-${crypto.randomUUID()}`,
        professionals: { create: { name: "Test professional" } },
        services: {
          create: { name: "Test service", price: 50, durationMinutes: 30 },
        },
        customers: {
          create: [
            { name: "First customer", phone: `5511${Date.now()}` },
            { name: "Second customer", phone: `5522${Date.now()}` },
          ],
        },
      },
      include: { professionals: true, services: true, customers: true },
    });
    barbershopId = shop.id;
    professionalId = shop.professionals[0].id;
    serviceId = shop.services[0].id;
    firstCustomerId = shop.customers[0].id;
    secondCustomerId = shop.customers[1].id;
  });

  afterAll(async () => {
    if (barbershopId) await prisma.barbershop.delete({ where: { id: barbershopId } });
    await prisma.$disconnect();
  });

  it("allows only one of two overlapping appointments", async () => {
    const startsAt = new Date("2030-01-10T12:00:00.000Z");
    const endsAt = new Date("2030-01-10T12:30:00.000Z");
    const results = await Promise.allSettled([
      prisma.appointment.create({
        data: {
          barbershopId,
          professionalId,
          serviceId,
          customerId: firstCustomerId,
          startsAt,
          endsAt,
        },
      }),
      prisma.appointment.create({
        data: {
          barbershopId,
          professionalId,
          serviceId,
          customerId: secondCustomerId,
          startsAt,
          endsAt,
        },
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("serializes a block racing an appointment", async () => {
    const startsAt = new Date("2030-01-11T12:00:00.000Z");
    const endsAt = new Date("2030-01-11T12:30:00.000Z");
    const booking = prisma.$transaction(async (tx) => {
      await lockTenantCalendar(tx, barbershopId);
      const block = await tx.scheduleBlock.findFirst({
        where: { barbershopId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
      });
      if (block) throw new Error("blocked");
      return tx.appointment.create({
        data: {
          barbershopId,
          professionalId,
          serviceId,
          customerId: secondCustomerId,
          startsAt,
          endsAt,
        },
      });
    });
    const blocking = prisma.$transaction(async (tx) => {
      await lockTenantCalendar(tx, barbershopId);
      const appointment = await tx.appointment.findFirst({
        where: {
          barbershopId,
          professionalId,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
      });
      if (appointment) throw new Error("occupied");
      return tx.scheduleBlock.create({
        data: { barbershopId, professionalId, startsAt, endsAt },
      });
    });

    const results = await Promise.allSettled([booking, blocking]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("enforces rate limits consistently through PostgreSQL", async () => {
    const scope = `integration:${crypto.randomUUID()}`;
    const request = new Request("http://localhost/test", {
      headers: { "x-real-ip": "192.0.2.10" },
    });
    await enforceRateLimit(request, { scope, limit: 2, windowMs: 60_000 });
    await enforceRateLimit(request, { scope, limit: 2, windowMs: 60_000 });
    await expect(enforceRateLimit(request, { scope, limit: 2, windowMs: 60_000 })).rejects.toThrow(
      "Muitas tentativas",
    );
    await prisma.rateLimitBucket.deleteMany({ where: { key: { startsWith: scope } } });
  });
});

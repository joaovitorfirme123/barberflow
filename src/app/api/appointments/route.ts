import { z } from "zod";

import { lockTenantCalendar, resolveBookableSlot } from "@/lib/booking";
import { addCalendarDays, calendarDateInTimeZone, localDateTimeToUtc } from "@/lib/dates";
import { assertSameOrigin, errorResponse, HttpError, ok } from "@/lib/http";
import { idSchema } from "@/lib/id";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireManager, requireUser } from "@/lib/tenant";

const manualSchema = z.object({
  serviceId: idSchema,
  professionalId: idSchema,
  date: z.string(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") ?? calendarDateInTimeZone(new Date(), user.barbershop.timezone);
    const professionalId = searchParams.get("professionalId");
    const dayStart = localDateTimeToUtc(date, "00:00", user.barbershop.timezone);
    const dayEnd = localDateTimeToUtc(addCalendarDays(date, 1), "00:00", user.barbershop.timezone);
    const appointments = await prisma.appointment.findMany({
      where: {
        barbershopId: user.barbershopId,
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
        ...(professionalId ? { professionalId } : {}),
      },
      include: { service: true, professional: true, customer: true },
      orderBy: { startsAt: "asc" },
    });

    return ok({
      date,
      appointments: appointments.map((appointment) => ({
        id: appointment.id,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: appointment.status,
        notes: appointment.notes,
        service: {
          id: appointment.service.id,
          name: appointment.service.name,
          price: Number(appointment.service.price),
        },
        professional: { id: appointment.professional.id, name: appointment.professional.name },
        customer: {
          id: appointment.customer.id,
          name: appointment.customer.name,
          phone: appointment.customer.phone,
        },
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireManager();
    const input = manualSchema.parse(await request.json());
    const phone = normalizePhone(input.customerPhone);
    const appointment = await prisma.$transaction(async (tx) => {
      await lockTenantCalendar(tx, user.barbershopId);
      const { service, professional, startsAt, endsAt } = await resolveBookableSlot(
        tx,
        user.barbershop,
        input,
      );
      const customer = await tx.customer.upsert({
        where: { barbershopId_phone: { barbershopId: user.barbershopId, phone } },
        update: { name: input.customerName },
        create: { barbershopId: user.barbershopId, name: input.customerName, phone },
      });
      return tx.appointment.create({
        data: {
          barbershopId: user.barbershopId,
          serviceId: service.id,
          professionalId: professional.id,
          customerId: customer.id,
          startsAt,
          endsAt,
          notes: input.notes,
        },
      });
    });
    return ok({ appointment }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      String(error.message).includes("appointments_professional_time_no_overlap")
    ) {
      return errorResponse(new HttpError(409, "Esse horário já está ocupado."));
    }
    return errorResponse(error);
  }
}

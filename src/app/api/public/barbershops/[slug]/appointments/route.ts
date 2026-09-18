import { z } from "zod";

import { lockTenantCalendar, resolveBookableSlot } from "@/lib/booking";
import { parseCalendarDate } from "@/lib/dates";
import { errorResponse, HttpError, ok } from "@/lib/http";
import { idSchema } from "@/lib/id";
import { normalizePhone, whatsappLink } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { trackProductEvent } from "@/lib/product-events";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  serviceId: idSchema,
  professionalId: idSchema,
  date: z.string(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await enforceRateLimit(request, {
      scope: `booking:${slug}`,
      limit: 20,
      windowMs: 10 * 60_000,
    });
    const input = schema.parse(await request.json());
    parseCalendarDate(input.date);
    const phone = normalizePhone(input.customerPhone);
    await enforceRateLimit(request, {
      scope: `booking-phone:${slug}`,
      limit: 5,
      windowMs: 10 * 60_000,
      identity: phone,
    });
    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 100) {
      throw new HttpError(400, "Identificador da tentativa de agendamento inválido.");
    }

    const barbershop = await prisma.barbershop.findUnique({ where: { slug } });
    if (!barbershop) throw new HttpError(404, "Barbearia não encontrada.");

    const appointment = await prisma.$transaction(async (tx) => {
      await lockTenantCalendar(tx, barbershop.id);
      const existing = await tx.appointment.findUnique({
        where: {
          barbershopId_idempotencyKey: { barbershopId: barbershop.id, idempotencyKey },
        },
        include: { service: true, professional: true, customer: true },
      });
      if (existing) return existing;
      const { service, professional, startsAt, endsAt } = await resolveBookableSlot(
        tx,
        barbershop,
        input,
      );
      const customer = await tx.customer.upsert({
        where: { barbershopId_phone: { barbershopId: barbershop.id, phone } },
        update: {},
        create: { barbershopId: barbershop.id, name: input.customerName, phone },
      });

      return tx.appointment.create({
        data: {
          barbershopId: barbershop.id,
          serviceId: service.id,
          professionalId: professional.id,
          customerId: customer.id,
          startsAt,
          endsAt,
          notes: input.notes,
          idempotencyKey,
        },
        include: { service: true, professional: true, customer: true },
      });
    });
    await trackProductEvent("BOOKING_COMPLETED", barbershop.id, {
      serviceId: appointment.serviceId,
      professionalId: appointment.professionalId,
    });

    const message = [
      `Olá! Sou ${input.customerName}.`,
      `Acabei de agendar um horário na ${barbershop.name}.`,
      `Serviço: ${appointment.service.name}`,
      `Profissional: ${appointment.professional.name}`,
      `Data: ${input.date} às ${input.time}`,
    ].join("\n");

    return ok(
      {
        appointment: {
          id: appointment.id,
          date: input.date,
          time: input.time,
          service: appointment.service.name,
          professional: appointment.professional.name,
          customer: appointment.customer.name,
          status: appointment.status,
        },
        whatsappUrl: barbershop.phone ? whatsappLink(barbershop.phone, message) : undefined,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("appointments_professional_time_no_overlap")
    ) {
      return errorResponse(
        new HttpError(409, "Esse horário acabou de ser reservado por outra pessoa."),
      );
    }

    return errorResponse(error);
  }
}

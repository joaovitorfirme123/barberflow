import { z } from "zod";

import { calculateAvailableSlots, slotEnd } from "@/lib/availability";
import { addCalendarDays, localDateTimeToUtc, parseCalendarDate } from "@/lib/dates";
import { errorResponse, HttpError, ok } from "@/lib/http";
import { idSchema } from "@/lib/id";
import { normalizePhone, whatsappLink } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

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
    const input = schema.parse(await request.json());
    parseCalendarDate(input.date);
    const phone = normalizePhone(input.customerPhone);

    const barbershop = await prisma.barbershop.findUnique({ where: { slug } });
    if (!barbershop) throw new HttpError(404, "Barbearia não encontrada.");

    const [service, professional] = await Promise.all([
      prisma.service.findFirst({
        where: {
          id: input.serviceId,
          barbershopId: barbershop.id,
          active: true,
          professionals: { some: { professionalId: input.professionalId } },
        },
      }),
      prisma.professional.findFirst({
        where: { id: input.professionalId, barbershopId: barbershop.id, active: true },
      }),
    ]);
    if (!service || !professional)
      throw new HttpError(400, "Serviço ou profissional indisponível.");

    const dayStart = localDateTimeToUtc(input.date, "00:00", barbershop.timezone);
    const dayEnd = localDateTimeToUtc(addCalendarDays(input.date, 1), "00:00", barbershop.timezone);
    const businessHour = await prisma.businessHour.findUnique({
      where: {
        barbershopId_weekday: {
          barbershopId: barbershop.id,
          weekday: new Date(`${input.date}T12:00:00Z`).getUTCDay(),
        },
      },
    });
    const [appointments, blocks] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          barbershopId: barbershop.id,
          professionalId: professional.id,
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        select: { startsAt: true, endsAt: true },
      }),
      prisma.scheduleBlock.findMany({
        where: {
          barbershopId: barbershop.id,
          OR: [{ professionalId: null }, { professionalId: professional.id }],
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { startsAt: true, endsAt: true },
      }),
    ]);

    const slots = calculateAvailableSlots({
      date: input.date,
      timeZone: barbershop.timezone,
      businessHour: businessHour ?? undefined,
      durationMinutes: service.durationMinutes,
      slotIntervalMinutes: barbershop.slotIntervalMinutes,
      minBookingNoticeMinutes: barbershop.minBookingNoticeMinutes,
      maxBookingDays: barbershop.maxBookingDays,
      appointments,
      blocks,
    });
    const startsAt = localDateTimeToUtc(input.date, input.time, barbershop.timezone);
    const startIso = startsAt.toISOString();
    if (!slots.includes(startIso))
      throw new HttpError(409, "Esse horário não está mais disponível.");
    const endsAt = slotEnd(startsAt, service.durationMinutes);

    const appointment = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { barbershopId_phone: { barbershopId: barbershop.id, phone } },
        update: { name: input.customerName },
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
        },
        include: { service: true, professional: true, customer: true },
      });
    });

    const message = [
      `Olá, ${appointment.customer.name}!`,
      `Seu horário na ${barbershop.name} foi agendado.`,
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
        whatsappUrl: whatsappLink(phone, message),
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

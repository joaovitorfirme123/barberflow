import { errorResponse, HttpError, ok } from "@/lib/http";
import { calculateAvailableSlots } from "@/lib/availability";
import { addCalendarDays, localDateTimeToUtc, parseCalendarDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const professionalId = searchParams.get("professionalId");
    if (!date || !serviceId || !professionalId) {
      throw new HttpError(400, "Data, serviço e profissional são obrigatórios.");
    }

    parseCalendarDate(date);
    const barbershop = await prisma.barbershop.findUnique({ where: { slug } });
    if (!barbershop) throw new HttpError(404, "Barbearia não encontrada.");

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        barbershopId: barbershop.id,
        active: true,
        professionals: { some: { professionalId } },
      },
    });
    const professional = await prisma.professional.findFirst({
      where: { id: professionalId, barbershopId: barbershop.id, active: true },
    });
    if (!service || !professional)
      throw new HttpError(404, "Serviço ou profissional indisponível.");

    const dayStart = localDateTimeToUtc(date, "00:00", barbershop.timezone);
    const dayEnd = localDateTimeToUtc(addCalendarDays(date, 1), "00:00", barbershop.timezone);
    const [businessHour, appointments, blocks] = await Promise.all([
      prisma.businessHour.findUnique({
        where: {
          barbershopId_weekday: {
            barbershopId: barbershop.id,
            weekday: new Date(`${date}T12:00:00Z`).getUTCDay(),
          },
        },
      }),
      prisma.appointment.findMany({
        where: {
          barbershopId: barbershop.id,
          professionalId,
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
          status: { in: ["SCHEDULED", "CONFIRMED"] },
        },
        select: { startsAt: true, endsAt: true },
      }),
      prisma.scheduleBlock.findMany({
        where: {
          barbershopId: barbershop.id,
          OR: [{ professionalId: null }, { professionalId }],
          startsAt: { lt: dayEnd },
          endsAt: { gt: dayStart },
        },
        select: { startsAt: true, endsAt: true },
      }),
    ]);

    const slots = calculateAvailableSlots({
      date,
      timeZone: barbershop.timezone,
      businessHour: businessHour ?? undefined,
      durationMinutes: service.durationMinutes,
      slotIntervalMinutes: barbershop.slotIntervalMinutes,
      minBookingNoticeMinutes: barbershop.minBookingNoticeMinutes,
      maxBookingDays: barbershop.maxBookingDays,
      appointments,
      blocks,
    });

    return ok({ date, timezone: barbershop.timezone, slots });
  } catch (error) {
    return errorResponse(error);
  }
}

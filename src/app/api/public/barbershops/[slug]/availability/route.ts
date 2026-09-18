import { errorResponse, HttpError, ok } from "@/lib/http";
import { getAvailableSlots } from "@/lib/booking";
import { parseCalendarDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await enforceRateLimit(request, {
      scope: `availability:${slug}`,
      limit: 120,
      windowMs: 60_000,
    });
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

    const { service, slots } = await getAvailableSlots(prisma, barbershop, {
      date,
      serviceId,
      professionalId,
    });

    return ok({ date, timezone: barbershop.timezone, durationMinutes: service.durationMinutes, slots });
  } catch (error) {
    return errorResponse(error);
  }
}

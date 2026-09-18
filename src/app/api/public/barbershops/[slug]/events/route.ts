import { z } from "zod";

import { errorResponse, HttpError, ok } from "@/lib/http";
import { trackProductEvent } from "@/lib/product-events";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({ event: z.enum(["PUBLIC_PAGE_VIEWED", "BOOKING_STARTED"]) });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await enforceRateLimit(request, { scope: `event:${slug}`, limit: 60, windowMs: 60_000 });
    const input = schema.parse(await request.json());
    const barbershop = await prisma.barbershop.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!barbershop) throw new HttpError(404, "Barbearia não encontrada.");
    await trackProductEvent(input.event, barbershop.id);
    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

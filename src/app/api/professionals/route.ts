import { z } from "zod";

import { assertSameOrigin, errorResponse, HttpError, ok } from "@/lib/http";
import { idSchema } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { requireManager, requireUser } from "@/lib/tenant";
import { refreshOnboardingStatus, trackProductEvent } from "@/lib/product-events";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  photoUrl: z.string().trim().url().nullable().optional(),
  active: z.boolean().optional(),
  serviceIds: z.array(idSchema).optional().default([]),
});

export async function GET() {
  try {
    const user = await requireUser();
    const professionals = await prisma.professional.findMany({
      where: { barbershopId: user.barbershopId },
      include: { services: { include: { service: true } } },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
    return ok({ professionals });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireManager();
    const input = schema.parse(await request.json());
    const services = await prisma.service.findMany({
      where: { id: { in: input.serviceIds }, barbershopId: user.barbershopId },
      select: { id: true },
    });
    if (services.length !== input.serviceIds.length) {
      throw new HttpError(400, "Serviço inválido para esta barbearia.");
    }

    const professional = await prisma.professional.create({
      data: {
        name: input.name,
        photoUrl: input.photoUrl,
        active: input.active,
        barbershopId: user.barbershopId,
        services: { create: input.serviceIds.map((serviceId) => ({ serviceId })) },
      },
      include: { services: true },
    });
    await trackProductEvent("PROFESSIONAL_CREATED", user.barbershopId);
    await refreshOnboardingStatus(user.barbershopId);
    return ok({ professional }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

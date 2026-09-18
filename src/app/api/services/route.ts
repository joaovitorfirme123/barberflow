import { z } from "zod";

import { assertSameOrigin, errorResponse, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireManager, requireUser } from "@/lib/tenant";
import { refreshOnboardingStatus, trackProductEvent } from "@/lib/product-events";

const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  price: z.number().min(0).max(100000),
  durationMinutes: z.number().int().min(5).max(480),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const services = await prisma.service.findMany({
      where: { barbershopId: user.barbershopId },
      include: { professionals: { include: { professional: true } } },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
    return ok({ services });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireManager();
    const input = serviceSchema.parse(await request.json());
    const service = await prisma.$transaction(async (tx) => {
      const professionals = await tx.professional.findMany({
        where: { barbershopId: user.barbershopId, active: true },
        select: { id: true },
        take: 2,
      });
      const createdService = await tx.service.create({
        data: {
          ...input,
          barbershopId: user.barbershopId,
          ...(professionals.length === 1
            ? { professionals: { create: { professionalId: professionals[0].id } } }
            : {}),
        },
        include: { professionals: { include: { professional: true } } },
      });
      return createdService;
    });
    await trackProductEvent("SERVICE_CREATED", user.barbershopId);
    await refreshOnboardingStatus(user.barbershopId);
    return ok({ service }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

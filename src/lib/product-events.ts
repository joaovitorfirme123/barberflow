import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ProductEventName =
  | "BARBERSHOP_CREATED"
  | "ONBOARDING_COMPLETED"
  | "SERVICE_CREATED"
  | "PROFESSIONAL_CREATED"
  | "PUBLIC_PAGE_VIEWED"
  | "BOOKING_STARTED"
  | "BOOKING_COMPLETED"
  | "APPOINTMENT_COMPLETED"
  | "NO_SHOW_RECORDED";

export async function trackProductEvent(
  name: ProductEventName,
  barbershopId?: string,
  metadata?: Prisma.InputJsonValue,
) {
  try {
    await prisma.productEvent.create({ data: { name, barbershopId, metadata } });
  } catch (error) {
    console.error("Failed to record product event", { name, barbershopId, error });
  }
}

export async function refreshOnboardingStatus(barbershopId: string) {
  const [barbershop, serviceCount, professionalCount, businessHourCount] = await Promise.all([
    prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { phone: true, onboardingCompletedAt: true },
    }),
    prisma.service.count({ where: { barbershopId, active: true } }),
    prisma.professional.count({
      where: {
        barbershopId,
        active: true,
        services: { some: { service: { active: true } } },
      },
    }),
    prisma.businessHour.count({ where: { barbershopId } }),
  ]);
  if (
    !barbershop ||
    barbershop.onboardingCompletedAt ||
    !barbershop.phone ||
    serviceCount === 0 ||
    professionalCount === 0 ||
    businessHourCount !== 7
  ) {
    return;
  }
  const result = await prisma.barbershop.updateMany({
    where: { id: barbershopId, onboardingCompletedAt: null },
    data: { onboardingCompletedAt: new Date() },
  });
  if (result.count) await trackProductEvent("ONBOARDING_COMPLETED", barbershopId);
}

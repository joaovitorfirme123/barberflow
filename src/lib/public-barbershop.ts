import { prisma } from "@/lib/prisma";

import type { PublicBarbershop } from "@/components/tenant-types";

export async function getPublicBarbershop(slug: string): Promise<PublicBarbershop | null> {
  const barbershop = await prisma.barbershop.findUnique({
    where: { slug },
    include: {
      services: {
        where: {
          active: true,
          professionals: { some: { professional: { active: true } } },
        },
        orderBy: { name: "asc" },
      },
      professionals: {
        where: { active: true },
        include: { services: { include: { service: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!barbershop) return null;

  return {
    id: barbershop.id,
    name: barbershop.name,
    slug: barbershop.slug,
    phone: barbershop.phone,
    address: barbershop.address,
    instagram: barbershop.instagram,
    logoUrl: barbershop.logoUrl,
    timezone: barbershop.timezone,
    services: barbershop.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      duration: service.durationMinutes,
    })),
    professionals: barbershop.professionals.map((professional) => ({
      id: professional.id,
      name: professional.name,
      photoUrl: professional.photoUrl,
      serviceIds: professional.services
        .filter((item) => item.service.active)
        .map((item) => item.serviceId),
    })),
  };
}

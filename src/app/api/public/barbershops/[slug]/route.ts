import { errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const barbershop = await prisma.barbershop.findUnique({
      where: { slug },
      include: {
        services: { where: { active: true }, orderBy: { name: "asc" } },
        professionals: {
          where: { active: true },
          include: { services: { include: { service: true } } },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!barbershop) throw new HttpError(404, "Barbearia não encontrada.");

    return ok({
      barbershop: {
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
          durationMinutes: service.durationMinutes,
        })),
        professionals: barbershop.professionals.map((professional) => ({
          id: professional.id,
          name: professional.name,
          photoUrl: professional.photoUrl,
          serviceIds: professional.services
            .filter((item) => item.service.active)
            .map((item) => item.serviceId),
        })),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

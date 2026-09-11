import { errorResponse, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const query = new URL(request.url).searchParams.get("q")?.trim();
    const customers = await prisma.customer.findMany({
      where: {
        barbershopId: user.barbershopId,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { startsAt: "desc" },
          take: 20,
          include: { service: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return ok({ customers });
  } catch (error) {
    return errorResponse(error);
  }
}

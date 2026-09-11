import { z } from "zod";

import { errorResponse, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireManager, requireUser } from "@/lib/tenant";

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
    const user = await requireManager();
    const input = serviceSchema.parse(await request.json());
    const service = await prisma.service.create({
      data: { ...input, barbershopId: user.barbershopId },
    });
    return ok({ service }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

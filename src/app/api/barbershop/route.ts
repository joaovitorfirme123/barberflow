import { z } from "zod";

import { errorResponse, ok } from "@/lib/http";
import { normalizePhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/slug";
import { requireManager, requireUser } from "@/lib/tenant";
import { assertValidTimeZone } from "@/lib/dates";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(3).max(80).optional(),
  phone: z.string().trim().nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  instagram: z.string().trim().max(120).nullable().optional(),
  logoUrl: z.string().trim().url().nullable().optional(),
  timezone: z.string().trim().optional(),
  minBookingNoticeMinutes: z.number().int().min(0).max(10080).optional(),
  maxBookingDays: z.number().int().min(1).max(365).optional(),
  slotIntervalMinutes: z.number().int().min(5).max(120).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    return ok({ barbershop: user.barbershop });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireManager();
    const input = updateSchema.parse(await request.json());
    const data: Record<string, unknown> = { ...input };

    if (input.slug) data.slug = normalizeSlug(input.slug);
    if (input.phone !== undefined) data.phone = input.phone ? normalizePhone(input.phone) : null;
    if (input.timezone) assertValidTimeZone(input.timezone);

    const barbershop = await prisma.barbershop.update({
      where: { id: user.barbershopId },
      data,
    });

    return ok({ barbershop });
  } catch (error) {
    return errorResponse(error);
  }
}

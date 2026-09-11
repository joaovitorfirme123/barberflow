import bcrypt from "bcryptjs";
import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import { errorResponse, HttpError, ok } from "@/lib/http";
import { normalizePhone } from "@/lib/phone";
import { normalizeSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";
import { assertValidTimeZone } from "@/lib/dates";

const schema = z.object({
  ownerName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  barbershopName: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(3).max(80),
  phone: z.string().trim().optional(),
  timezone: z.string().trim().default("America/Sao_Paulo"),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const slug = normalizeSlug(input.slug);
    assertValidTimeZone(input.timezone);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const phone = input.phone ? normalizePhone(input.phone) : undefined;

    const user = await prisma.$transaction(async (tx) => {
      const barbershop = await tx.barbershop.create({
        data: {
          name: input.barbershopName,
          slug,
          phone,
          timezone: input.timezone,
          businessHours: {
            create: Array.from({ length: 7 }, (_, weekday) => ({
              weekday,
              openTime: "09:00",
              closeTime: "19:00",
              breakStart: "12:00",
              breakEnd: "13:00",
              closed: weekday === 0,
            })),
          },
          users: {
            create: {
              name: input.ownerName,
              email: input.email,
              passwordHash,
              role: "OWNER",
            },
          },
        },
        include: { users: true },
      });

      return { ...barbershop.users[0], barbershopId: barbershop.id };
    });

    const response = ok(
      {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        barbershop: { id: user.barbershopId, slug },
      },
      { status: 201 },
    );
    await setSessionCookie(response, user);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "Telefone inválido") {
      return errorResponse(new HttpError(400, error.message));
    }

    return errorResponse(error);
  }
}

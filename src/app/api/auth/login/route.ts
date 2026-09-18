import bcrypt from "bcryptjs";
import { z } from "zod";

import { setSessionCookie } from "@/lib/auth";
import { errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/slug";
import { enforceRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  slug: z.string().trim().min(3).max(80),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    await enforceRateLimit(request, {
      scope: "auth:login",
      limit: 10,
      windowMs: 15 * 60_000,
      identity: `${input.email}:${input.slug}`,
    });
    const user = await prisma.user.findFirst({
      where: {
        email: input.email,
        active: true,
        barbershop: { slug: normalizeSlug(input.slug) },
      },
      include: { barbershop: true },
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "E-mail ou senha inválidos.");
    }

    const response = ok({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      barbershop: { id: user.barbershop.id, slug: user.barbershop.slug },
    });
    await setSessionCookie(response, user);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "barberflow_session";

type SessionClaims = {
  userId: string;
  barbershopId: string;
  role: string;
};

function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET deve ter pelo menos 32 caracteres");
  }

  return new TextEncoder().encode(value);
}

export async function setSessionCookie(
  response: Response,
  user: { id: string; barbershopId: string; role: string },
) {
  const token = await new SignJWT({
    userId: user.id,
    barbershopId: user.barbershopId,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret());

  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
}

export async function clearSessionCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  );
}

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionClaims>(token, sessionSecret());
    if (!payload.userId || !payload.barbershopId) return null;

    return prisma.user.findFirst({
      where: { id: payload.userId, barbershopId: payload.barbershopId, active: true },
      include: { barbershop: true },
    });
  } catch {
    return null;
  }
}

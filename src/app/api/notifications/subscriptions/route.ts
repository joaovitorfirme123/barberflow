import { z } from "zod";

import { assertSameOrigin, errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/tenant";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = subscriptionSchema.parse(await request.json());
    await prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      update: { userId: user.id, p256dh: input.keys.p256dh, auth: input.keys.auth },
      create: {
        userId: user.id,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
      },
    });

    return ok({ subscribed: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const body = await request.json();
    const endpoint = z.string().url().parse(body.endpoint);
    const deleted = await prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint },
    });
    if (!deleted.count) throw new HttpError(404, "Dispositivo não encontrado.");
    return ok({ subscribed: false });
  } catch (error) {
    return errorResponse(error);
  }
}

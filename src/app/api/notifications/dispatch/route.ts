import { formatInTimeZone } from "@/lib/dates";
import { errorResponse, HttpError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import {
  isExpiredPushSubscription,
  pushConfigured,
  sendPush,
} from "@/lib/push";

const REMINDER_KIND = "APPOINTMENT_10_MINUTES";

function authorizeCron(request: Request) {
  const expected = process.env.CRON_SECRET;
  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || provided !== expected) throw new HttpError(401, "Cron não autorizado.");
}

async function dispatch(request: Request) {
  try {
    authorizeCron(request);
    if (!pushConfigured()) throw new HttpError(503, "Web Push não está configurado.");

    const now = new Date();
    const windowStart = new Date(now.getTime() + 9 * 60_000);
    const windowEnd = new Date(now.getTime() + 11 * 60_000);
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        startsAt: { gte: windowStart, lt: windowEnd },
      },
      include: {
        service: true,
        professional: true,
        customer: true,
        barbershop: {
          select: {
            timezone: true,
            users: {
              where: { active: true },
              select: { id: true, pushSubscriptions: true },
            },
          },
        },
      },
    });

    let sent = 0;
    let skipped = 0;
    for (const appointment of appointments) {
      for (const user of appointment.barbershop.users) {
        if (!user.pushSubscriptions.length) continue;

        let delivery;
        try {
          delivery = await prisma.notificationDelivery.create({
            data: {
              appointmentId: appointment.id,
              userId: user.id,
              kind: REMINDER_KIND,
            },
          });
        } catch (error) {
          if (isUniqueViolation(error)) {
            skipped += 1;
            continue;
          }
          throw error;
        }

        const time = formatInTimeZone(appointment.startsAt, appointment.barbershop.timezone);
        const payload = {
          title: "Próximo atendimento em 10 minutos",
          body: `${appointment.customer.name} · ${appointment.service.name} às ${time.split(", ").at(-1)}`,
          url: "/painel",
          tag: `appointment-${appointment.id}`,
        };
        const results = await Promise.allSettled(
          user.pushSubscriptions.map((subscription) => sendPush(subscription, payload)),
        );
        const expiredEndpoints = user.pushSubscriptions
          .filter((_, index) => {
            const result = results[index];
            return result.status === "rejected" && isExpiredPushSubscription(result.reason);
          })
          .map((subscription) => subscription.endpoint);
        if (expiredEndpoints.length) {
          await prisma.pushSubscription.deleteMany({
            where: { endpoint: { in: expiredEndpoints } },
          });
        }

        if (results.some((result) => result.status === "fulfilled")) {
          sent += 1;
        } else {
          await prisma.notificationDelivery.delete({ where: { id: delivery.id } });
        }
      }
    }

    return ok({ windowStart, windowEnd, appointments: appointments.length, sent, skipped });
  } catch (error) {
    return errorResponse(error);
  }
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export function GET(request: Request) {
  return dispatch(request);
}

export function POST(request: Request) {
  return dispatch(request);
}

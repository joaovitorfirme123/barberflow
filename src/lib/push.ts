import webpush from "web-push";

export type AppointmentReminderPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

export function pushPublicKey() {
  return process.env.PUSH_VAPID_PUBLIC_KEY ?? "";
}

export function pushConfigured() {
  return Boolean(
    process.env.PUSH_VAPID_SUBJECT &&
      process.env.PUSH_VAPID_PUBLIC_KEY &&
      process.env.PUSH_VAPID_PRIVATE_KEY,
  );
}

function configurePush() {
  const subject = process.env.PUSH_VAPID_SUBJECT;
  const publicKey = process.env.PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.PUSH_VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error("Web Push não está configurado.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: AppointmentReminderPayload,
) {
  configurePush();
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify(payload),
  );
}

export function isExpiredPushSubscription(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    [404, 410].includes(Number(error.statusCode))
  );
}

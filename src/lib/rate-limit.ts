import { createHash } from "node:crypto";

import { HttpError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  identity?: string;
};

function requestIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function enforceRateLimit(request: Request, options: RateLimitOptions) {
  const now = new Date();
  const resetBefore = new Date(now.getTime() - options.windowMs);
  const expiresAt = new Date(now.getTime() + options.windowMs * 2);
  const key = `${options.scope}:${digest(`${requestIp(request)}:${options.identity ?? ""}`)}`;
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "windowStart", "expiresAt")
    VALUES (${key}, 1, ${now}, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limit_buckets"."windowStart" < ${resetBefore} THEN 1
        ELSE "rate_limit_buckets"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "rate_limit_buckets"."windowStart" < ${resetBefore} THEN ${now}
        ELSE "rate_limit_buckets"."windowStart"
      END,
      "expiresAt" = ${expiresAt}
    RETURNING "count"
  `;
  if ((rows[0]?.count ?? 1) > options.limit) {
    throw new HttpError(429, "Muitas tentativas. Aguarde um pouco e tente novamente.");
  }
}

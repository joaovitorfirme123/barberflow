ALTER TABLE "appointments" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "appointments_barbershopId_idempotencyKey_key"
ON "appointments"("barbershopId", "idempotencyKey");

CREATE TABLE "rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "rate_limit_buckets_expiresAt_idx" ON "rate_limit_buckets"("expiresAt");

CREATE TABLE "product_events" (
  "id" UUID NOT NULL,
  "barbershopId" UUID,
  "name" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "product_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_events_barbershopId_name_createdAt_idx"
ON "product_events"("barbershopId", "name", "createdAt");

CREATE INDEX "product_events_name_createdAt_idx"
ON "product_events"("name", "createdAt");

ALTER TABLE "product_events"
ADD CONSTRAINT "product_events_barbershopId_fkey"
FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

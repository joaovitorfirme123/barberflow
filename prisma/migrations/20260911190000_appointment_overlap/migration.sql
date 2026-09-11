CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
ADD CONSTRAINT "appointments_professional_time_no_overlap"
EXCLUDE USING gist (
  "professionalId" WITH =,
  tsrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" IN ('SCHEDULED'::"AppointmentStatus", 'CONFIRMED'::"AppointmentStatus"));

-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN     "maxBookingDays" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "minBookingNoticeMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 30;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

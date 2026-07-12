-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "rejectionReason" TEXT;

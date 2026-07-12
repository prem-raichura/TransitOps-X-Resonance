-- DropIndex
DROP INDEX "Driver_phone_key";

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "phone";

-- CreateIndex
CREATE UNIQUE INDEX "Driver_contact_key" ON "Driver"("contact");

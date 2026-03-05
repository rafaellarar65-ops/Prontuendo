-- AlterEnum
BEGIN;
CREATE TYPE "PrescriptionStatus_new" AS ENUM ('RASCUNHO', 'ATIVA', 'CANCELADA', 'VENCIDA');
ALTER TABLE "Prescription"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PrescriptionStatus_new" USING (
    CASE
      WHEN "status"::text = 'DISPENSADA' THEN 'CANCELADA'::"PrescriptionStatus_new"
      ELSE "status"::text::"PrescriptionStatus_new"
    END
  );
ALTER TYPE "PrescriptionStatus" RENAME TO "PrescriptionStatus_old";
ALTER TYPE "PrescriptionStatus_new" RENAME TO "PrescriptionStatus";
DROP TYPE "PrescriptionStatus_old";
ALTER TABLE "Prescription" ALTER COLUMN "status" SET DEFAULT 'RASCUNHO';
COMMIT;

-- AlterTable
ALTER TABLE "Prescription"
  DROP COLUMN "issuedAt",
  DROP COLUMN "items",
  DROP COLUMN "signature",
  DROP COLUMN "pdfUrl",
  ADD COLUMN "notes" TEXT;

-- DropIndex
DROP INDEX IF EXISTS "Prescription_tenantId_patientId_issuedAt_idx";

-- CreateTable
CREATE TABLE "PrescriptionItem" (
  "id" TEXT NOT NULL,
  "prescriptionId" TEXT NOT NULL,
  "medicationName" TEXT NOT NULL,
  "dosage" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "route" TEXT,
  "duration" TEXT,
  "instructions" TEXT,
  "quantity" DOUBLE PRECISION,
  "unit" TEXT,
  "sortOrder" INTEGER NOT NULL,

  CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "activeIngredient" TEXT,
  "presentation" TEXT,
  "category" TEXT,
  "isControlled" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prescription_tenantId_patientId_createdAt_idx" ON "Prescription"("tenantId", "patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Prescription_tenantId_status_idx" ON "Prescription"("tenantId", "status");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_sortOrder_idx" ON "PrescriptionItem"("prescriptionId", "sortOrder");

-- CreateIndex
CREATE INDEX "Medication_tenantId_name_idx" ON "Medication"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Medication_tenantId_category_idx" ON "Medication"("tenantId", "category");

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey"
  FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

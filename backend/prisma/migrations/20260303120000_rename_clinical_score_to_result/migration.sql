-- Rename table to preserve historical data
ALTER TABLE "ClinicalScore" RENAME TO "ClinicalScoreResult";

-- Rename columns to the new domain model
ALTER TABLE "ClinicalScoreResult" RENAME COLUMN "scoreType" TO "scoreName";
ALTER TABLE "ClinicalScoreResult" RENAME COLUMN "inputs" TO "inputData";
ALTER TABLE "ClinicalScoreResult" RENAME COLUMN "result" TO "scoreValue";
ALTER TABLE "ClinicalScoreResult" RENAME COLUMN "clinicianId" TO "calculatedBy";

-- Add new fields
ALTER TABLE "ClinicalScoreResult"
  ADD COLUMN "classification" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Keep constraint names aligned with the renamed table
ALTER TABLE "ClinicalScoreResult" RENAME CONSTRAINT "ClinicalScore_pkey" TO "ClinicalScoreResult_pkey";
ALTER TABLE "ClinicalScoreResult" RENAME CONSTRAINT "ClinicalScore_tenantId_fkey" TO "ClinicalScoreResult_tenantId_fkey";
ALTER TABLE "ClinicalScoreResult" RENAME CONSTRAINT "ClinicalScore_patientId_fkey" TO "ClinicalScoreResult_patientId_fkey";

-- Replace old indexes with the new access pattern
DROP INDEX IF EXISTS "ClinicalScore_tenantId_patientId_scoreType_idx";
DROP INDEX IF EXISTS "ClinicalScore_tenantId_patientId_calculatedAt_idx";
CREATE INDEX "ClinicalScoreResult_tenantId_patientId_scoreName_calculatedAt_idx"
  ON "ClinicalScoreResult"("tenantId", "patientId", "scoreName", "calculatedAt");

-- Add user relation for calculatedBy
ALTER TABLE "ClinicalScoreResult"
  ADD CONSTRAINT "ClinicalScoreResult_calculatedBy_fkey"
  FOREIGN KEY ("calculatedBy") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
DO $$
BEGIN
  CREATE TYPE "ClinicalProtocolStatus" AS ENUM ('ATIVO', 'INATIVO', 'RASCUNHO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- AlterTable
ALTER TABLE "ClinicalProtocol"
  DROP COLUMN IF EXISTS "parentProtocolId",
  DROP COLUMN IF EXISTS "diseaseId",
  DROP COLUMN IF EXISTS "protocolType",
  DROP COLUMN IF EXISTS "consensusSource",
  DROP COLUMN IF EXISTS "recommendationJson",
  DROP COLUMN IF EXISTS "active",
  DROP COLUMN IF EXISTS "deletedAt",
  DROP COLUMN IF EXISTS "updatedBy",
  ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "targetCondition" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "status" "ClinicalProtocolStatus" NOT NULL DEFAULT 'RASCUNHO',
  ADD COLUMN IF NOT EXISTS "steps" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "medications" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "inclusionCriteria" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "references" TEXT;

ALTER TABLE "ClinicalProtocol"
  ALTER COLUMN "createdBy" SET NOT NULL;

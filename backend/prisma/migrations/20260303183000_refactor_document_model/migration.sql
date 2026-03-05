-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('EXAME', 'LAUDO', 'PRESCRICAO', 'ATESTADO', 'TERMO', 'IMAGEM_CLINICA', 'OUTRO');

-- DropIndex
DROP INDEX IF EXISTS "Document_tenantId_category_idx";

-- DropIndex
DROP INDEX IF EXISTS "Document_tenantId_consultationId_idx";

-- Rename columns to preserve existing data
ALTER TABLE "Document" RENAME COLUMN "createdBy" TO "uploadedById";
ALTER TABLE "Document" RENAME COLUMN "filePath" TO "storageKey";

-- Add new columns with temporary defaults to keep consistency for existing rows
ALTER TABLE "Document"
  ADD COLUMN "fileSize" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Convert existing category values to enum safely
ALTER TABLE "Document"
  ALTER COLUMN "category" TYPE "DocumentCategory"
  USING (
    CASE UPPER("category")
      WHEN 'EXAME' THEN 'EXAME'
      WHEN 'LAUDO' THEN 'LAUDO'
      WHEN 'PRESCRICAO' THEN 'PRESCRICAO'
      WHEN 'ATESTADO' THEN 'ATESTADO'
      WHEN 'TERMO' THEN 'TERMO'
      WHEN 'IMAGEM_CLINICA' THEN 'IMAGEM_CLINICA'
      ELSE 'OUTRO'
    END
  )::"DocumentCategory";

-- Keep schema defaults aligned with Prisma model
ALTER TABLE "Document"
  ALTER COLUMN "fileSize" DROP DEFAULT,
  ALTER COLUMN "tags" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Document_tenantId_patientId_category_idx" ON "Document"("tenantId", "patientId", "category");

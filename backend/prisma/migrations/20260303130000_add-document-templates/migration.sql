-- CreateEnum
CREATE TYPE "DocumentTemplateCategory" AS ENUM (
  'RECEITUARIO',
  'ATESTADO',
  'LAUDO',
  'SOLICITACAO_EXAME',
  'RELATORIO_BIO',
  'TERMO_CONSENTIMENTO',
  'PERSONALIZADO'
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" "DocumentTemplateCategory" NOT NULL,
  "canvasJson" JSONB NOT NULL,
  "thumbnailUrl" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentTemplate_tenantId_category_idx" ON "DocumentTemplate"("tenantId", "category");

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

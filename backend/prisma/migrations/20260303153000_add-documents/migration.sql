-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM (
  'EXAME',
  'LAUDO',
  'PRESCRICAO',
  'ATESTADO',
  'TERMO',
  'IMAGEM_CLINICA',
  'OUTRO'
);

-- CreateTable
CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "consultationId" TEXT,
  "uploadedById" TEXT NOT NULL,
  "category" "DocumentCategory" NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "description" TEXT,
  "tags" TEXT[],
  "isFromPortal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_tenantId_patientId_category_idx"
  ON "Document"("tenantId", "patientId", "category");

-- CreateIndex
CREATE INDEX "Document_tenantId_patientId_createdAt_idx"
  ON "Document"("tenantId", "patientId", "createdAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_consultationId_fkey"
  FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

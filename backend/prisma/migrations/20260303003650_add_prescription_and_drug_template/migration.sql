-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ATIVA', 'CANCELADA', 'VENCIDA', 'DISPENSADA');

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "clinicianId" TEXT NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ATIVA',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "items" JSONB NOT NULL,
    "signature" JSONB,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "brandName" TEXT,
    "class" TEXT NOT NULL,
    "defaultDose" TEXT NOT NULL,
    "defaultRoute" TEXT NOT NULL,
    "defaultFreq" TEXT NOT NULL,
    "instructions" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prescription_tenantId_patientId_issuedAt_idx" ON "Prescription"("tenantId", "patientId", "issuedAt");

-- CreateIndex
CREATE INDEX "Prescription_tenantId_consultationId_idx" ON "Prescription"("tenantId", "consultationId");

-- CreateIndex
CREATE INDEX "DrugTemplate_tenantId_class_idx" ON "DrugTemplate"("tenantId", "class");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugTemplate" ADD CONSTRAINT "DrugTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

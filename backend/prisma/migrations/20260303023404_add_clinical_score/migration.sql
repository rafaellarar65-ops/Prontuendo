-- CreateTable
CREATE TABLE "ClinicalScore" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "scoreType" TEXT NOT NULL,
    "inputs" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicianId" TEXT,

    CONSTRAINT "ClinicalScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalScore_tenantId_patientId_scoreType_idx" ON "ClinicalScore"("tenantId", "patientId", "scoreType");

-- CreateIndex
CREATE INDEX "ClinicalScore_tenantId_patientId_calculatedAt_idx" ON "ClinicalScore"("tenantId", "patientId", "calculatedAt");

-- AddForeignKey
ALTER TABLE "ClinicalScore" ADD CONSTRAINT "ClinicalScore_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalScore" ADD CONSTRAINT "ClinicalScore_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

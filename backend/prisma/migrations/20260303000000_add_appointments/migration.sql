-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('PRIMEIRA_CONSULTA', 'RETORNO', 'TELECONSULTA', 'EXAME', 'URGENCIA');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT NOT NULL,
    "type" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'AGENDADO',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "notes" TEXT,
    "returnFromConsultationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Appointment_tenantId_scheduledAt_idx" ON "Appointment"("tenantId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_patientId_scheduledAt_idx" ON "Appointment"("tenantId", "patientId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_clinicianId_scheduledAt_idx" ON "Appointment"("tenantId", "clinicianId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_status_scheduledAt_idx" ON "Appointment"("tenantId", "status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_id_tenantId_key" ON "Appointment"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

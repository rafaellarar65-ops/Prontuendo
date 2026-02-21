CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Multi-tenant + temporal access patterns
CREATE INDEX IF NOT EXISTS idx_patient_tenant_created ON "Patient" ("tenantId", "createdAt" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_consultation_tenant_patient_date ON "Consultation" ("tenantId", "patientId", "consultationDate" DESC) WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_tenant_doctor_start ON "Appointment" ("tenantId", "doctorId", "startsAt");
CREATE INDEX IF NOT EXISTS idx_glucose_tenant_patient_measured ON "GlucoseLog" ("tenantId", "patientId", "measuredAt" DESC);
CREATE INDEX IF NOT EXISTS idx_bioimpedance_tenant_patient_examdate ON "BioimpedanceExam" ("tenantId", "patientId", "examDate" DESC);
CREATE INDEX IF NOT EXISTS idx_auditlog_tenant_created ON "AuditLog" ("tenantId", "createdAt" DESC);

-- JSONB indexes
CREATE INDEX IF NOT EXISTS gin_consultation_content ON "Consultation" USING GIN ("contentJson");
CREATE INDEX IF NOT EXISTS gin_bioimpedance_segment_data ON "BioimpedanceExam" USING GIN ("segmentData");
CREATE INDEX IF NOT EXISTS gin_template_element_content ON "TemplateElement" USING GIN ("contentJson");
CREATE INDEX IF NOT EXISTS gin_ai_extraction_json ON "AIExtractionResult" USING GIN ("extractedJson");

-- Trigram search (full name / documents / diseases)
CREATE INDEX IF NOT EXISTS trgm_patient_full_name ON "Patient" USING GIN ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_medical_document_title ON "MedicalDocument" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_disease_name ON "Disease" USING GIN (name gin_trgm_ops);

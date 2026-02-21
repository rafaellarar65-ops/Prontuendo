-- Enable RLS on all tenant-scoped tables.
-- Requires: SELECT set_config('app.current_tenant_id', '<doctor-uuid>', true);
-- For patient portal: set_config('app.current_patient_id', '<patient-uuid>', true)

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'User','UserProfile','Clinic','ClinicUser','Patient','PatientAddress','PatientConsent','PatientPortalAccount',
    'Consultation','SOAPRecord','AnamnesisRecord','PhysicalExam','Diagnosis','BioimpedanceExam','BodyCircumference',
    'GlucoseLog','GlucoseTarget','GlucoseReminder','LabResult','LabResultItem','ExamRequest','ExamRequestItem',
    'MedicalDocument','DocumentTemplateV2','DocumentSignature','Prescription','PrescriptionItem','Disease','Medication',
    'ClinicalProtocol','ClinicalScoreDefinition','ClinicalScoreResult','Appointment','TimeSlot','ServiceDefinition',
    'TemplateElement','AuditLog','AccessLog','DataExportLog','AIInteractionLog','AIExtractionResult'
  ] LOOP
    EXECUTE format('ALTER TABLE "%s" ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY tenant_isolation_select_%s ON "%s" FOR SELECT USING ("tenantId"::text = current_setting(''app.current_tenant_id'', true));', lower(t), t);
    EXECUTE format('CREATE POLICY tenant_isolation_mod_%s ON "%s" FOR ALL USING ("tenantId"::text = current_setting(''app.current_tenant_id'', true)) WITH CHECK ("tenantId"::text = current_setting(''app.current_tenant_id'', true));', lower(t), t);
  END LOOP;
END $$;

-- Immutable audit trail: insert-only on AuditLog.
DROP POLICY IF EXISTS tenant_isolation_mod_auditlog ON "AuditLog";
CREATE POLICY audit_insert_only ON "AuditLog"
  FOR INSERT
  WITH CHECK ("tenantId"::text = current_setting('app.current_tenant_id', true));

CREATE POLICY audit_select_tenant ON "AuditLog"
  FOR SELECT
  USING ("tenantId"::text = current_setting('app.current_tenant_id', true));

REVOKE UPDATE, DELETE ON "AuditLog" FROM authenticated, anon;

-- Patient portal can only see own records.
CREATE POLICY portal_patient_self_patient ON "Patient"
  FOR SELECT
  USING (id::text = current_setting('app.current_patient_id', true));

CREATE POLICY portal_patient_self_glucose ON "GlucoseLog"
  FOR SELECT
  USING ("patientId"::text = current_setting('app.current_patient_id', true));

CREATE POLICY portal_patient_self_consultation ON "Consultation"
  FOR SELECT
  USING ("patientId"::text = current_setting('app.current_patient_id', true));


CREATE OR REPLACE FUNCTION prevent_auditlog_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is immutable (insert-only)';
END;
$$;

DROP TRIGGER IF EXISTS trg_auditlog_no_update ON "AuditLog";
CREATE TRIGGER trg_auditlog_no_update
BEFORE UPDATE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_auditlog_mutation();

DROP TRIGGER IF EXISTS trg_auditlog_no_delete ON "AuditLog";
CREATE TRIGGER trg_auditlog_no_delete
BEFORE DELETE ON "AuditLog"
FOR EACH ROW EXECUTE FUNCTION prevent_auditlog_mutation();

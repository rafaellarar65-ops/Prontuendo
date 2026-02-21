# Data Model - EndocrinoPront Pro

## ER Diagram (Mermaid)

```mermaid
erDiagram
  User ||--o| UserProfile : has
  User ||--o{ ClinicUser : linked
  Clinic ||--o{ ClinicUser : has
  Clinic ||--o{ ServiceDefinition : offers
  Clinic ||--o{ Appointment : hosts

  Patient ||--o{ PatientAddress : has
  Patient ||--o{ PatientConsent : has
  Patient ||--o| PatientPortalAccount : accesses
  Patient ||--o{ Consultation : receives
  Patient ||--o{ BioimpedanceExam : performs
  Patient ||--o{ GlucoseLog : records
  Patient ||--o{ LabResult : receives
  Patient ||--o{ Prescription : receives

  Consultation ||--o| SOAPRecord : contains
  Consultation ||--o| AnamnesisRecord : contains
  Consultation ||--o| PhysicalExam : contains
  Consultation ||--o{ Diagnosis : contains

  BioimpedanceExam ||--o{ BodyCircumference : details
  LabResult ||--o{ LabResultItem : contains
  ExamRequest ||--o{ ExamRequestItem : contains
  Prescription ||--o{ PrescriptionItem : contains
  MedicalDocument ||--o{ DocumentSignature : signed_by
```

## Decisões de design
- Multi-tenant por coluna `tenantId` em **todas** as entidades.
- Chave primária UUID (`gen_random_uuid()`) para segurança e integração distribuída.
- Soft delete (`deletedAt`) em entidades de negócio para retenção legal.
- JSONB para estruturas flexíveis (template editor, bioimpedância segmentar, conteúdo clínico).
- Versionamento de consulta com `versionGroupId` + `versionNumber`.
- `AuditLog` imutável (insert-only) e separado de `AccessLog` (acesso) e `DataExportLog` (portabilidade LGPD).
- Compatível com Supabase (RLS + extensões `pgcrypto` e `pg_trgm`).

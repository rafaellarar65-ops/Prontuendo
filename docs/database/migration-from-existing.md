# Migração de dados (Supabase atual + localStorage)

## Fontes
1. **Supabase GlicoCare**: leituras de glicemia, metas e lembretes.
2. **EndocrinoPront (localStorage)**: pacientes, consultas, documentos e templates legados.

## Passos
1. Exportar Supabase atual para CSV/JSON (`glucose_logs`, `targets`, `reminders`).
2. Extrair `localStorage` dos navegadores para arquivo JSON consolidado por clínica.
3. Rodar staging ETL em Node/NestJS:
   - normalizar CPF/telefone/data;
   - mapear IDs legados para UUID novo;
   - resolver duplicidades por CPF + data de nascimento.
4. Carregar tabelas na ordem:
   - Core (`User`, `Clinic`, `ClinicUser`)
   - `Patient` + `PatientAddress` + `PatientConsent`
   - clínico (`Consultation`, `SOAPRecord`, `AnamnesisRecord`, `PhysicalExam`, `Diagnosis`)
   - integrações (`Glucose*`, `Bioimpedance*`, `Lab*`, `MedicalDocument*`).
5. Validar contagens por tenant e checksums por paciente.
6. Ativar RLS e bloquear escrita no schema legado.

## Script-base (pseudo)
```ts
for (const oldPatient of localStorageDump.patients) {
  const patientId = upsertPatient(oldPatient)
  migrateConsultations(patientId, oldPatient.records)
  migrateDocuments(patientId, oldPatient.documents)
}

for (const row of glicoCareExport.logs) {
  prisma.glucoseLog.create({ data: mapGlucose(row) })
}
```

## Critérios de aceite
- 100% dos pacientes com vínculo de tenant.
- Nenhum registro sem `tenantId` ou `createdAt`.
- `AuditLog` registra início/fim da migração.

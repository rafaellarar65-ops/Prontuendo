# CHANGELOG — EndocrinoPront Pro

## 2026-03-02 — Integração dos 8 PRs do Codex (Iteração 3)

### Backend
- **PR #70 (Glucose):** Novos endpoints `GET /glucose?patientId=`, `GET /glucose/analyze?patientId=`, `POST /glucose` (patientId no body). Adicionados métodos `findByPatient`, `findLatest`, `analyzeGlucose` ao service.
- **PR #69 (Lab-results):** Novo endpoint `GET /lab-results?patientId=`. Renomeado `history()` → `findByPatient()`. Adicionado `findLatest()`.
- **PR #68 (Bioimpedância):** Novo endpoint `GET /bioimpedance?patientId=`. Removidos endpoints legados de extract/report/evolution. Adicionado campo `metadata` no DTO.
- **Patient Portal:** Adicionados 3 endpoints: `POST /:id/glucose`, `GET /:id/glucose/analysis`, `POST /:id/questionnaire`.

### Frontend (API Clients)
- Criado `src/lib/api/glucose-api.ts` — endpoints corretos + análise local (average, min, max, total, inRangePercent)
- Criado `src/lib/api/lab-api.ts` — list e create via HTTP real
- Atualizado `src/lib/api/bioimpedance-api.ts` — migrado de mock para HTTP real, method `evolution(patientId?)` corrigido
- Atualizado `src/lib/api/lab-results-api.ts` — usa `labApi` internamente

### Frontend (Hooks React Query)
- Criados: `use-glucose-query.ts`, `use-glucose-analysis-query.ts`, `use-create-glucose-mutation.ts`
- Criado: `use-lab-results-query.ts`
- Atualizados: `use-create-lab-result-mutation.ts`, `use-lab-results-history-query.ts`
- Criados: `use-autosave-consultation-mutation.ts`, `use-finalize-consultation-mutation.ts`
- Atualizados: `use-bioimpedance-evolution-query.ts` (aceita patientId?), `use-bioimpedance-actions.ts`
- Atualizado: `query-keys.ts` com chaves: glucose, labResults, analysis, glucoseHistory, glucoseAnalysis, consultationById, bioimpedanceEvolution(fn)

### Frontend (Páginas)
- **Perfil do Paciente (médico):** Abas reais: `ExamsTab` (tabela + modal criar exame + status automático), `GlucoseTab` (sparkline SVG + stats + modal registrar), `BioimpedanceTab` (cards + histórico)
- **Portal do Paciente:** Reescritas `glucose-page.tsx`, `exams-upload-page.tsx`, `profile-page.tsx`, `questionnaire-page.tsx` com API real

### Correções
- TypeScript: `useBioimpedancePreviewQuery` envolto em arrow function para evitar erro de tipo no queryFn

### Testes
- 27/27 backend tests passando (iter3)
- Todas as abas do perfil do paciente funcionando com dados reais

---

## Sessão Anterior — Implementação Base

### Database Migration
- Migrado de Supabase (bloqueado) → Neon PostgreSQL

### Módulos Implementados
- CRUD completo de Pacientes (criar, listar, buscar, editar, visualizar)
- Consulta SOAP: criação, autosave (mapeamento subjetivo→anamnese, etc.), finalização com hash
- IA (Gemini): diagnóstico diferencial na consulta
- Editor de Templates (Fabric.js): salvar/carregar

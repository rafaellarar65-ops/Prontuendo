# EndocrinoPront Pro - PRD

## Problema Original
Migrar e transformar o sistema "Prontuendo" (NestJS + React) em uma plataforma médica completa chamada **EndocrinoPront Pro**, com PostgreSQL, IA clínica, editor de templates, portal do paciente e conformidade LGPD.

## Stack Técnica
- **Backend:** NestJS + Prisma ORM + TypeScript (porta 8001)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS (porta 3000)
- **Banco de dados:** Neon PostgreSQL
- **IA:** Gemini 2.5 Flash (9 agentes clínicos)
- **Auth:** JWT customizado (Fase 1)

## Usuários Alvo
- Médico endocrinologista (Dr. Rafael)
- Recepcionistas de clínica
- Pacientes (via Portal do Paciente PWA)

## Credenciais de Teste
- Médico: `rafaellarar65@gmail.com` / `crucru22`
- Recepção: `recepcao@endocrinopro.com` / `Recepcao@123!`
- Tenant ID: `clitenant0000000000000001`

## Arquitetura de Dados (Neon PostgreSQL)
- **Tenant** → multi-clínica
- **User** (MEDICO | RECEPCAO | PATIENT)
- **Patient** (fullName, cpf, birthDate, sex, phone, email, address, notes, tags, lifecycle)
- **Consultation** + **ConsultationVersion** (DRAFT→FINALIZED com hash SHA-256)
- **GlucoseLog**, **LabResult**, **BioimpedanceExam**
- **Template** (canvas Fabric.js serializado)
- **ActivityLog** (auditoria imutável)

---

## O que foi Implementado

### ✅ Fase 0 — Setup & Estabilização
- Ambiente NestJS + React + Supervisor funcionando
- Proxy Vite `/api` → `http://localhost:8001`

### ✅ Fase 1a — Banco de Dados (2026-03-02)
- **Neon PostgreSQL** conectado (substituiu Supabase bloqueado por firewall)
- Schema Prisma com `sex`, `phone`, `email`, `address`, `notes` no Patient
- Seed executado (tenant + médico + recepcionista)
- Fix: Mapeamento `fullName`→`name` e `roles[]`→`role` no auth-api.ts

### ✅ Fase 1b — CRUD Completo de Pacientes (2026-03-02)
- Modal de criação com: nome, CPF, sexo, telefone, email, data nascimento
- Lista de pacientes com busca e filtro por ciclo de vida
- Perfil completo: 6 abas (Dados, Consultas, Exames, Glicemia, Bioimpedância, Documentos)
- Modal de edição inline com todos os campos
- API: GET/POST/PATCH/DELETE `/api/v1/patients`

### ✅ Fase 1c — Módulo de Consulta SOAP (2026-03-02)
- Nova Consulta com seletor de paciente (busca por nome)
- Formulário SOAP completo (Subjetivo, Objetivo, Avaliação, Plano)
- **Autosave** a cada 1.5s (mapeia frontend SOAP → backend DTO)
- **Finalizar** com hash SHA-256 e versioning imutável
- Correção crítica: mapeamento `{subjetivo,objetivo,avaliacao,plano}` → `{anamnese,exameFisico,diagnostico,prescricao}`

### ✅ Fase 2a — 9 Agentes IA com Gemini 2.5 Flash (2026-03-02)
1. `POST /ai/assist-consultation` — hipóteses diagnósticas + alertas
2. `POST /ai/extract-lab` — extração de laudos laboratoriais
3. `POST /ai/extract-bioimpedance` — extração de bioimpedância
4. `POST /ai/read-glucometer` — OCR de glicosímetro
5. `POST /ai/patient-evolution` — análise longitudinal
6. `POST /ai/suggest-protocol` — sugestão de protocolo clínico
7. `POST /ai/glucose-analysis` — análise de curva glicêmica
8. `POST /ai/nutrition-analysis` — análise nutricional
9. `POST /ai/prescription-check` — verificação de interações medicamentosas
- Painel de IA integrado na página de Nova Consulta (agent #1)

### ✅ Fase 2b — Editor de Templates Fabric.js (2026-03-02)
- Toolbar de ferramentas (texto, formas, variáveis, gráficos)
- **Salvar** template com nome para o banco via API
- **Carregar** templates salvos do banco
- Lista de templates reais (não mais hardcoded)

### ✅ Fase 2c — Portal do Paciente (2026-03-02)
- Home page com registro rápido de glicemia
- Navegação para: questionário, histórico, exames, documentos, perfil
- Logout funcional

---

## Backlog Priorizado

### P0 — Imediato
- [ ] Abas reais no perfil do paciente: Exames (tabela LabResults), Glicemia (gráfico SVG + lista), Bioimpedância (cards)
- [ ] Backend endpoints glucose/lab/bioimpedance CRUD (Codex está criando)
- [ ] Hooks React Query para glucose, lab, bioimpedance (Codex está criando)
- [ ] Páginas do Portal do Paciente: glicemia, exames, questionário, perfil (Codex está criando)

### P1 — Próximo Sprint
- [ ] Integrar Supabase Auth com MFA
- [ ] RLS (Row Level Security) para isolamento multi-tenant
- [ ] Testes E2E completos

### P2 — Futuro
- [ ] PWA Manifest + Service Worker (offline, ícones)
- [ ] VIDaaS para assinatura digital ICP-Brasil
- [ ] 3 novos prompts IA: glucose + nutrition + prescription (já implementados no backend)

### P3 — Backlog
- [ ] CI/CD pipeline
- [ ] LGPD compliance completa
- [ ] Notificações em tempo real (WebSocket)

---

## Arquivos-Chave
- `/app/backend/prisma/schema.prisma` — Schema completo
- `/app/backend/.env` — Neon PostgreSQL + Gemini API Key
- `/app/.env` — VITE_API_BASE_URL=/api/v1, VITE_TENANT_ID
- `/app/src/lib/api/consultation-api.ts` — Mapeamento SOAP→backend
- `/app/src/lib/api/ai-api.ts` — 9 endpoints de IA
- `/app/backend/src/ai/ai.service.ts` — Gemini 2.5 Flash integration
- `/app/backend/src/ai/prompts/` — 6 prompts médicos especializados
- `/app/src/pages/new-consultation-page.tsx` — SOAP + AI panel
- `/app/src/pages/patient-profile-page.tsx` — Perfil completo
- `/app/src/pages/patients-list-page.tsx` — Lista + criação
- `/app/src/features/template-editor/components/template-editor.tsx` — Fabric.js + save/load

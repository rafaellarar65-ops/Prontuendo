# EndocrinoPront Pro - PRD

## Problema Original
Migrar e transformar o sistema "Prontuendo" (NestJS + React) de um banco SQLite simples para uma plataforma médica completa chamada **EndocrinoPront Pro**, com PostgreSQL, autenticação robusta, multi-tenancy, IA e conformidade LGPD.

## Stack Técnica
- **Backend:** NestJS + Prisma ORM + TypeScript (porta 8001)
- **Frontend:** React + Vite + TypeScript + Tailwind CSS (porta 3000)
- **Banco de dados:** Neon PostgreSQL (desenvolvimento) / Supabase (planejado para produção)
- **Auth:** JWT customizado (Fase 1) → Supabase Auth com MFA (futuro)

## Usuários Alvo
- Médico endocrinologista (Dr. Rafael)
- Recepcionistas de clínica
- Pacientes (via Portal do Paciente PWA)

## Credenciais de Teste
- Médico: `rafaellarar65@gmail.com` / `crucru22`
- Recepção: `recepcao@endocrinopro.com` / `Recepcao@123!`
- Tenant ID: `clitenant0000000000000001`

## Arquitetura de Dados
- **Tenant** → multi-clínica (1 médico, N clínicas)
- **User** (MEDICO | RECEPCAO | PATIENT)
- **Patient** (com lifecycle, tags, CPF)
- **Consultation** + **ConsultationVersion** (rascunho/finalizado)
- **GlucoseLog**, **LabResult**, **BioimpedanceExam**
- **ActivityLog** (auditoria imutável)

---

## O que foi Implementado

### ✅ Fase 0 - Setup & Estabilização (Sessões anteriores)
- Configuração completa do ambiente NestJS + React
- Supervisor gerenciando frontend (porta 3000) e backend (porta 8001)
- Correção de dezenas de erros de dependência, compilação e configuração
- Proxy Vite `/api` → `http://localhost:8001`

### ✅ Fase 1a - Migração para PostgreSQL (2026-03-02)
- **Conexão Neon PostgreSQL** configurada e funcionando (`/app/backend/.env`)
- Schema Prisma aplicado via `prisma db push`
- Banco populado via `prisma db seed` (tenant + médico + recepcionista)
- Backend NestJS conectando ao Neon e iniciando corretamente
- **Fix bug:** Mapeamento `fullName`→`name` e `roles[]`→`role` no `auth-api.ts`
- Login frontend → dashboard funcionando end-to-end

---

## Backlog Priorizado

### P0 - Fase 1b (Em breve)
- [ ] Integrar Supabase Auth (substituir JWT customizado)
- [ ] Implementar RLS no Supabase para isolamento por tenant
- [ ] Testes E2E básicos (login, criar paciente, nova consulta)

### P1 - Fase 2 (Módulos Core)
- [ ] CRUD completo de Pacientes (frontend + backend)
- [ ] Módulo de Consultas (nova consulta, rascunho, finalizar)
- [ ] Módulo de Agenda (agendamentos)
- [ ] Bioimpedância e Exames de laboratório

### P2 - Fase 3 (Editor Gráfico)
- [ ] Editor de templates médicos com Fabric.js ("Photoshop Médico")
- [ ] Templates de prontuário personalizáveis

### P2 - Fase 4 (Portal do Paciente)
- [ ] PWA mobile-first para pacientes
- [ ] Upload de exames pelo paciente
- [ ] Histórico de glicemia

### P3 - Fase 5 (IA - Gemini API)
- [ ] 9 agentes de IA especializados:
  - Extração de laudos (OCR inteligente)
  - Extração de bioimpedância
  - Glucometro OCR
  - Evolução do paciente
  - Consenso de protocolos
  - Assistente de consulta
- Usar `integration_playbook_expert_v2` para playbook Gemini

### P3 - Fase 6 (Assinatura Digital)
- [ ] Integração VIDaaS (ICP-Brasil)
- Usar `integration_playbook_expert_v2` para playbook VIDaaS

### P3 - Fase 7 (Compliance & DevOps)
- [ ] LGPD compliance (RLS políticas, consentimento)
- [ ] CI/CD pipeline
- [ ] Testes de segurança RBAC e LGPD

---

## Arquivos-Chave
- `/app/backend/prisma/schema.prisma` - Schema do banco
- `/app/backend/.env` - Credenciais Neon PostgreSQL
- `/app/.env` - Config frontend Vite (VITE_API_BASE_URL, VITE_TENANT_ID)
- `/app/src/lib/api/auth-api.ts` - Mapeamento de resposta de login
- `/app/src/types/api.ts` - Tipos TypeScript da API
- `/app/src/app/medical-router.tsx` - Roteamento do app médico
- `/app/backend/prisma/seed.ts` - Seed do banco de dados

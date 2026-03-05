# EndocrinoPront Pro — PRD

## Problema Original
Migrar o sistema Prontuendo para PostgreSQL, implementar multi-tenancy e adicionar módulos de Portal do Paciente, editor de templates, assinatura digital (VIDaaS) e IA (Gemini).

## Usuários-alvo
- Médico Endocrinologista (MEDICO)
- Recepcionista (RECEPCAO)
- Paciente via Portal (PATIENT)

## Requisitos Core

### Autenticação
- Login JWT com tenant isolamento por `x-tenant-id`
- Portal do Paciente com JWT próprio (role PATIENT)

### Módulo de Pacientes
- CRUD completo: criar, listar, buscar, editar, visualizar perfil
- Campos: fullName, birthDate, sex, cpf, phone, email, address, notes, tags, lifecycle

### Módulo de Consultas (SOAP)
- Criar rascunho, autosave com mapeamento SOAP→DTO, finalizar com hash
- Editor com campos: Subjetivo, Objetivo, Avaliação, Plano

### Módulo de Agenda ✅ IMPLEMENTADO (2026-03-03)
- CRUD completo de agendamentos com persistência PostgreSQL
- Filtro por data e por paciente
- Tipos: PRIMEIRA_CONSULTA, RETORNO, TELECONSULTA, EXAME
- Status: AGENDADO, CONFIRMADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO
- Frontend: Página de agenda com navegação por data, modal de novo agendamento

### Módulo de IA
- Diagnóstico diferencial via Gemini no editor de consulta
- 9 agentes AI (glucose, lab, bioimpedância, protocolo, prescrição, etc.)

### Módulo de Templates
- Editor gráfico com Fabric.js — salvar e carregar templates

### Portal do Paciente (PWA)
- Páginas: home, glicemia, upload de exames, questionário pré-consulta, perfil

### Perfil do Paciente (Médico)
- Abas: Dados, Consultas, Exames (LabResults), Glicemia (gráfico + lista), Bioimpedância, Documentos

## Arquitetura Técnica
- **Backend:** NestJS, TypeScript, Prisma ORM, PostgreSQL (Neon)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn/UI, Zustand, React Query
- **IA:** Google Gemini Pro
- **Auth:** JWT custom (multi-tenant via x-tenant-id header)

## Credenciais de Teste
- Email: `rafaellarar65@gmail.com`
- Senha: `12345678`
- Tenant: `clitenant0000000000000001`

---

## Changelog

### 2026-03-05 — Integração de PRs do GitHub + Correções
- Puxado código atualizado do repositório GitHub com 187+ commits de PRs do Codex
- Resolvidos conflitos de merge no `schema.prisma` e `agenda.service.ts`
- Corrigido import `path` em `documents.module.ts` (default → namespace import)
- Corrigido `prescriptions.service.ts`: `issuedAt` → `createdAt` (campo não existia no schema)
- Corrigido erro de sintaxe em `patient-profile-page.tsx` (parêntese faltando no setMetadata)
- Atualizado seed para usar categorias corretas de DocumentTemplate
- Senha do seed alterada para `12345678` (consistência com handoff)
- **Testado:** 15/15 testes backend passando, frontend 100% funcional

### 2026-03-03 — Módulo de Agenda com Persistência PostgreSQL
- Adicionado modelo `Appointment` no Prisma schema com enums `AppointmentType` e `AppointmentStatus`
- Criado DTOs: `CreateAppointmentDto`, `UpdateAppointmentDto`
- Implementado `AgendaService` com métodos: `list`, `findOne`, `create`, `update`, `remove`, `listByPatient`
- Implementado `AgendaController` com endpoints REST completos
- Frontend já estava pronto (schedule-page.tsx, appointments-api.ts, hooks React Query)
- **Testado:** 22/22 testes passando (100% backend + frontend)

---

## Roadmap (Priorizado)

### 🔴 P0 — Próximos Itens
- **Bioimpedância — Modal de criação:** Adicionar modal para criar registros na aba de bioimpedância do perfil do paciente

### 🟠 P1 — Alta Prioridade
- **Prescrições — Persistência:** ✅ Já migrado para Prisma
- **Protocolos — Persistência:** Migrar `ProtocolsService` de in-memory para Prisma
- **Escores Clínicos — Persistência + lógica:** ✅ Já migrado para Prisma
- **Templates — Variáveis dinâmicas + PDF:** Implementar `{patient_name}` e exportação PDF
- **Perfil do Paciente — Aba Documentos real:** Conectar a um serviço real de documentos
- **Consulta — Histórico de versões:** Exibir versões salvas da tabela `ConsultationVersion`
- **IA — Painel enriquecido:** Enriquecer prompt com dados clínicos do paciente
- **Exames — Busca por paciente:** Adicionar autocomplete de paciente na página `/exames`

### 🟡 P2 — Média Prioridade
- **Portal do Paciente — PWA:** Implementar `manifest.json` e service worker
- **Portal do Paciente — Autenticação dedicada:** Flow de login específico para pacientes
- **Documentos — Upload real:** Implementar storage (S3)
- **Clínicas — Multi-tenancy:** Salvar e usar dados específicos da clínica
- **Usuários — Painel de gestão:** UI para gerenciar usuários
- **Configurações — Tela de settings:** Implementar página de configurações
- **Assinatura Digital — VIDaaS:** Integrar VIDaaS (ICP-Brasil)

### 🔵 P3 — Infraestrutura e Segurança
- **Row Level Security (RLS):** Configurar policies no Neon
- **Refresh Token + Rotação de Sessão**
- **Notificações — E-mail e SMS:** Integrar Resend/Twilio
- **CI/CD Pipeline**

### ⚪ Backlog / Futuro
- Dashboard de Analytics
- Agenda — Integração Google Calendar
- IA — 9 agentes adicionais
- App Mobile (React Native)
- Integração TISS/TUSS

---

## Bugs Conhecidos
- **Consulta autosave:** Mismatch de campos entre frontend (`{subjetivo,objetivo,avaliacao,plano}`) e backend (`{anamnese,exameFisico,diagnostico,prescricao}`) — corrigir em `/app/src/lib/api/consultation-api.ts`

---

## Arquivos de Referência Importantes
- `/app/backend/prisma/schema.prisma` - Schema do banco de dados
- `/app/backend/src/agenda/` - Módulo de agendamentos
- `/app/backend/src/prescriptions/` - Módulo de prescrições
- `/app/backend/src/scores/` - Módulo de escores clínicos
- `/app/src/pages/patient-profile-page.tsx` - Perfil do paciente
- `/app/src/pages/escores/scores-page.tsx` - Página de escores
- `/app/src/pages/prescricoes/prescriptions-page.tsx` - Página de prescrições

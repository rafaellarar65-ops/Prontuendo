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
- Senha: `crucru22`
- Tenant: `clitenant0000000000000001`

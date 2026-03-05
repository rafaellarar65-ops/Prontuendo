# 🚀 Prompts Rápidos - EndocrinoPront Pro

## 🔴 P0 - Máxima Prioridade

### 1. Modal de Bioimpedância
> Criar modal de criação de bioimpedância na aba do perfil do paciente. Campos: measuredAt, weightKg, bodyFatPct, muscleMassKg, bodyWaterPct, visceralFatLevel. Usar hook useCreateBioimpedanceMutation. Backend POST /api/v1/bioimpedance já existe.

---

## 🟠 P1 - Alta Prioridade

### 2. Protocolos → Prisma
> Migrar ProtocolsService de in-memory para Prisma. Criar model Protocol com: id, tenantId, name, description, category, content (Json), isActive, createdBy, timestamps. Endpoints CRUD.

### 3. Templates PDF + Variáveis
> Implementar substituição de variáveis ({{patient.fullName}}, {{doctor.crm}}, {{date}}) em templates. Gerar PDF com Puppeteer. Endpoint POST /api/v1/templates/:id/render.

### 4. Histórico de Versões
> Mostrar ConsultationVersion na UI. Sidebar com lista de versões, clicar para visualizar, destaque para versão final. Hook useConsultationVersionsQuery.

### 5. IA Enriquecida
> Enriquecer prompt Gemini com dados do paciente: últimos exames (labResults), bioimpedância recente, glicemias, escores clínicos. Atualizar ClinicalContextService.

### 6. Busca Paciente em Exames
> Adicionar autocomplete de paciente na página /exames. Usar Combobox Shadcn, debounce 300ms, filtrar LabResults por patientId.

---

## 🟡 P2 - Média Prioridade

### 7. PWA Portal Paciente
> Transformar /paciente em PWA. Criar manifest.webmanifest, service worker com cache offline, ícones 192x512, banner de instalação.

### 8. Upload S3
> Migrar DocumentsService de disco local para AWS S3. Criar S3Service com upload, getSignedUrl, delete. Usar @aws-sdk/client-s3.

### 9. VIDaaS Assinatura Digital
> Integrar VIDaaS para assinatura ICP-Brasil. Fluxo: gerar sessão → redirect para auth → callback → salvar documento assinado.

---

## 🔵 P3 - Infra

### 10. RLS PostgreSQL
> Habilitar Row Level Security no Neon. Policies por tenantId. Middleware para SET app.current_tenant_id no contexto.

---

## ⚪ Backlog

### 11. Dashboard Analytics
> Métricas: consultas/período, taxa no-show, top diagnósticos, novos vs retornos. Usar Recharts. Criar AnalyticsService.

### 12. Google Calendar
> Sincronização bidirecional. OAuth 2.0, googleapis lib. Criar UserIntegration model para tokens.

---

## 🐛 Bug Fix

### 13. Autosave Consultas
> Corrigir mismatch: frontend {subjetivo,objetivo,avaliacao,plano} → backend {anamnese,exameFisico,diagnostico,prescricao}. Criar mapeamento em consultation-api.ts.

---

📁 **Arquivo completo:** `/app/docs/PROMPTS_AI_STUDIO_JULES.md`

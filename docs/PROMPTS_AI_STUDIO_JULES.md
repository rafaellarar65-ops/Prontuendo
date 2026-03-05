# 📋 Prompts para Google AI Studio / Jules / Codex
# Projeto: EndocrinoPront Pro (Sistema EMR para Endocrinologistas)

Este documento contém prompts detalhados para implementar as próximas funcionalidades do sistema. Cada prompt é auto-contido e pode ser usado diretamente no Google AI Studio, Jules (GitHub), ou Codex.

---

## 🔴 P0 — PRIORIDADE MÁXIMA

### PROMPT 1: Modal de Criação de Bioimpedância no Perfil do Paciente

```
Contexto do Projeto:
- Backend: NestJS + Prisma + PostgreSQL (Neon)
- Frontend: React + TypeScript + Vite + Tailwind CSS + Shadcn/UI
- O perfil do paciente está em /app/src/pages/patient-profile-page.tsx
- A aba "Bioimpedância" já existe mas só mostra dados, não permite criação

Tarefa:
Adicionar um modal de criação de bioimpedância na aba "Bioimpedância" do perfil do paciente.

Modelo Prisma existente (BioimpedanceExam):
```prisma
model BioimpedanceExam {
  id           String   @id @default(cuid())
  tenantId     String
  patientId    String
  measuredAt   DateTime
  weightKg     Float?
  bodyFatPct   Float?
  muscleMassKg Float?
  metadata     Json?
  createdAt    DateTime @default(now())
  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  patient      Patient  @relation(fields: [patientId], references: [id])
}
```

Backend (já existe):
- POST /api/v1/bioimpedance - Criar exame
- GET /api/v1/bioimpedance?patientId=xxx - Listar exames do paciente

Frontend - Implementar:
1. Criar hook `useCreateBioimpedanceMutation` em /app/src/features/bioimpedance/
2. Criar componente modal com campos:
   - Data da medição (measuredAt) - required
   - Peso (weightKg) - kg
   - Gordura Corporal (bodyFatPct) - %
   - Massa Muscular (muscleMassKg) - kg
   - Campos adicionais em metadata: bodyWaterPct, visceralFatLevel, basalMetabolicRateKcal, boneMassKg
3. Adicionar botão "Novo Exame" na aba Bioimpedância do patient-profile-page.tsx
4. Usar componentes Shadcn/UI: Dialog, Input, Button, Label
5. Validar campos numéricos (aceitar vírgula como decimal - formato brasileiro)
6. Após salvar, invalidar query de bioimpedância para atualizar lista

Estilo:
- Modal com bordas arredondadas (rounded-2xl)
- Inputs com estilo: rounded-lg border-slate-200 focus:border-indigo-400
- Botão principal: bg-indigo-600 hover:bg-indigo-700
- Usar grid de 2 colunas para campos lado a lado

Arquivos a criar/modificar:
- /app/src/features/bioimpedance/use-create-bioimpedance-mutation.ts
- /app/src/pages/patient-profile-page.tsx (adicionar modal e botão)
```

---

## 🟠 P1 — ALTA PRIORIDADE

### PROMPT 2: Migrar Protocolos para Prisma (Persistência no Banco)

```
Contexto do Projeto:
- Backend: NestJS + Prisma + PostgreSQL
- O serviço de protocolos atualmente usa armazenamento in-memory
- Precisa ser migrado para usar Prisma com persistência real

Tarefa:
Migrar o módulo de Protocolos de in-memory para Prisma.

Passo 1 - Adicionar modelo ao Prisma Schema (/app/backend/prisma/schema.prisma):
```prisma
model Protocol {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  category    String   // ex: DIABETES, TIREOIDE, OBESIDADE
  content     Json     // conteúdo do protocolo em JSON
  isActive    Boolean  @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  @@index([tenantId, category])
  @@index([tenantId, isActive])
}
```

Passo 2 - Adicionar relação no model Tenant:
```prisma
protocols Protocol[]
```

Passo 3 - Atualizar ProtocolsService (/app/backend/src/protocols/protocols.service.ts):
- Injetar PrismaService no construtor
- Substituir array in-memory por chamadas Prisma:
  - list(tenantId) → prisma.protocol.findMany({ where: { tenantId, isActive: true } })
  - findOne(tenantId, id) → prisma.protocol.findFirst({ where: { id, tenantId } })
  - create(tenantId, dto) → prisma.protocol.create({ data: { ...dto, tenantId } })
  - update(tenantId, id, dto) → prisma.protocol.update({ where: { id }, data: dto })
  - remove(tenantId, id) → prisma.protocol.update({ where: { id }, data: { isActive: false } })

Passo 4 - Criar/Atualizar DTOs:
- CreateProtocolDto: { name: string, description?: string, category: string, content: object }
- UpdateProtocolDto: PartialType(CreateProtocolDto)

Passo 5 - Rodar migrations:
```bash
npx prisma db push
npx prisma generate
```

Passo 6 - Seed inicial com protocolos de exemplo para endocrinologia:
- Protocolo de Diabetes Tipo 2
- Protocolo de Hipotireoidismo
- Protocolo de Obesidade

Arquivos a modificar:
- /app/backend/prisma/schema.prisma
- /app/backend/src/protocols/protocols.service.ts
- /app/backend/src/protocols/dto/create-protocol.dto.ts
- /app/backend/src/protocols/dto/update-protocol.dto.ts
- /app/backend/prisma/seed.ts
```

---

### PROMPT 3: Templates com Variáveis Dinâmicas + Exportação PDF

```
Contexto do Projeto:
- Backend: NestJS + Prisma
- Frontend: React + Fabric.js para editor de templates
- Templates já existem no banco (DocumentTemplate)
- Falta implementar substituição de variáveis e exportação PDF

Tarefa:
Implementar variáveis dinâmicas nos templates e exportação para PDF.

Variáveis suportadas:
- {{patient.fullName}} - Nome do paciente
- {{patient.cpf}} - CPF do paciente
- {{patient.birthDate}} - Data de nascimento
- {{patient.age}} - Idade calculada
- {{doctor.fullName}} - Nome do médico
- {{doctor.crm}} - CRM do médico
- {{date}} - Data atual formatada (dd/MM/yyyy)
- {{consultation.anamnese}} - Anamnese da consulta
- {{consultation.exameFisico}} - Exame físico
- {{consultation.diagnostico}} - Diagnóstico
- {{consultation.prescricao}} - Prescrição

Backend - Criar endpoint de renderização:
POST /api/v1/templates/:id/render
Body: { patientId: string, consultationId?: string }
Response: { html: string } ou PDF direto

Implementação do TemplatesService:
```typescript
async renderTemplate(tenantId: string, templateId: string, context: RenderContext) {
  const template = await this.prisma.documentTemplate.findFirst({ where: { id: templateId, tenantId } });
  const patient = await this.prisma.patient.findFirst({ where: { id: context.patientId, tenantId } });
  const doctor = await this.prisma.user.findFirst({ where: { id: context.doctorId, tenantId } });
  
  // Substituir variáveis no canvasJson
  let content = JSON.stringify(template.canvasJson);
  content = content.replace(/\{\{patient\.fullName\}\}/g, patient.fullName);
  content = content.replace(/\{\{patient\.cpf\}\}/g, patient.cpf || '');
  // ... outras substituições
  
  return JSON.parse(content);
}
```

Backend - Exportação PDF (usar Puppeteer):
```typescript
async generatePdf(tenantId: string, templateId: string, context: RenderContext): Promise<Buffer> {
  const rendered = await this.renderTemplate(tenantId, templateId, context);
  const html = this.canvasToHtml(rendered); // Converter canvas JSON para HTML
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();
  
  return pdf;
}
```

Frontend - Adicionar botões na página de templates:
1. Botão "Visualizar" - Abre modal com preview renderizado
2. Botão "Gerar PDF" - Faz download do PDF

Arquivos a criar/modificar:
- /app/backend/src/templates/templates.service.ts
- /app/backend/src/templates/templates.controller.ts
- /app/backend/src/templates/dto/render-template.dto.ts
- /app/src/pages/templates/templates-page.tsx
- /app/src/lib/api/template-api.ts
```

---

### PROMPT 4: Histórico de Versões de Consultas

```
Contexto do Projeto:
- Modelo ConsultationVersion já existe no Prisma
- Cada consulta pode ter múltiplas versões
- Ao salvar (autosave) ou finalizar, uma nova versão é criada
- Falta mostrar o histórico de versões na UI

Modelo existente:
```prisma
model ConsultationVersion {
  id             String       @id @default(cuid())
  consultationId String
  version        Int
  isFinal        Boolean      @default(false)
  content        Json
  hash           String?
  createdAt      DateTime     @default(now())
  consultation   Consultation @relation(fields: [consultationId], references: [id], onDelete: Cascade)

  @@unique([consultationId, version])
}
```

Tarefa:
Implementar visualização do histórico de versões na página de consulta.

Backend - Endpoint já existe:
GET /api/v1/consultations/:id/versions

Frontend - Implementar:
1. Criar hook `useConsultationVersionsQuery` em /app/src/features/consultations/
2. Na página de consulta (/app/src/pages/new-consultation-page.tsx):
   - Adicionar sidebar ou dropdown "Histórico de Versões"
   - Listar versões com: número da versão, data/hora, status (rascunho/final)
   - Permitir clicar em uma versão para visualizar (modo somente leitura)
   - Destacar versão atual
3. Comparação de versões (opcional):
   - Botão "Comparar" entre duas versões
   - Mostrar diff visual dos campos SOAP

Componente de Histórico:
```tsx
const VersionHistory = ({ consultationId }: { consultationId: string }) => {
  const { data: versions } = useConsultationVersionsQuery(consultationId);
  
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-slate-700">Histórico de Versões</h3>
      {versions?.map((v) => (
        <button
          key={v.id}
          className={clsx(
            "w-full text-left p-3 rounded-lg border",
            v.isFinal ? "border-emerald-200 bg-emerald-50" : "border-slate-200"
          )}
        >
          <div className="flex justify-between">
            <span>Versão {v.version}</span>
            {v.isFinal && <span className="text-xs text-emerald-600">Final</span>}
          </div>
          <span className="text-xs text-slate-400">
            {new Date(v.createdAt).toLocaleString('pt-BR')}
          </span>
        </button>
      ))}
    </div>
  );
};
```

Arquivos a criar/modificar:
- /app/src/features/consultations/use-consultation-versions-query.ts
- /app/src/pages/new-consultation-page.tsx
- /app/src/lib/api/consultation-api.ts (adicionar getVersions)
```

---

### PROMPT 5: Painel de IA Enriquecido com Dados Clínicos

```
Contexto do Projeto:
- IA usa Google Gemini Pro
- Atualmente o prompt de IA só recebe o texto da consulta
- Precisa enriquecer com dados clínicos do paciente

Tarefa:
Enriquecer o contexto da IA com dados clínicos do paciente para sugestões mais precisas.

Backend - Atualizar ClinicalContextService (/app/backend/src/ai/clinical-context.service.ts):
```typescript
async buildContext(tenantId: string, patientId: string): Promise<ClinicalContext> {
  const [patient, labResults, bioimpedance, glucose, scores] = await Promise.all([
    this.prisma.patient.findFirst({ where: { id: patientId, tenantId } }),
    this.prisma.labResult.findMany({ 
      where: { patientId, tenantId },
      orderBy: { resultDate: 'desc' },
      take: 10 
    }),
    this.prisma.bioimpedanceExam.findMany({
      where: { patientId, tenantId },
      orderBy: { measuredAt: 'desc' },
      take: 3
    }),
    this.prisma.glucoseLog.findMany({
      where: { patientId, tenantId },
      orderBy: { measuredAt: 'desc' },
      take: 30
    }),
    this.prisma.clinicalScore.findMany({
      where: { patientId, tenantId },
      orderBy: { calculatedAt: 'desc' },
      take: 5
    }),
  ]);

  return {
    patient: {
      age: this.calculateAge(patient.birthDate),
      sex: patient.sex,
    },
    recentLabs: labResults.map(l => ({
      name: l.examName,
      value: l.value,
      unit: l.unit,
      date: l.resultDate,
    })),
    latestBioimpedance: bioimpedance[0] ? {
      weight: bioimpedance[0].weightKg,
      bodyFat: bioimpedance[0].bodyFatPct,
      muscleMass: bioimpedance[0].muscleMassKg,
    } : null,
    glucoseStats: this.calculateGlucoseStats(glucose),
    clinicalScores: scores.map(s => ({
      type: s.scoreType,
      result: s.result,
    })),
  };
}
```

Backend - Atualizar prompt da IA:
```typescript
async generateDifferentialDiagnosis(tenantId: string, patientId: string, consultationText: string) {
  const context = await this.clinicalContextService.buildContext(tenantId, patientId);
  
  const prompt = `
Você é um assistente médico especializado em endocrinologia.

DADOS DO PACIENTE:
- Idade: ${context.patient.age} anos
- Sexo: ${context.patient.sex}
${context.latestBioimpedance ? `
BIOIMPEDÂNCIA RECENTE:
- Peso: ${context.latestBioimpedance.weight} kg
- Gordura Corporal: ${context.latestBioimpedance.bodyFat}%
- Massa Muscular: ${context.latestBioimpedance.muscleMass} kg
` : ''}
${context.recentLabs.length > 0 ? `
EXAMES LABORATORIAIS RECENTES:
${context.recentLabs.map(l => `- ${l.name}: ${l.value} ${l.unit || ''}`).join('\n')}
` : ''}
${context.clinicalScores.length > 0 ? `
ESCORES CLÍNICOS:
${context.clinicalScores.map(s => `- ${s.type}: ${JSON.stringify(s.result)}`).join('\n')}
` : ''}

CONSULTA ATUAL:
${consultationText}

Com base nos dados acima, forneça:
1. Diagnósticos diferenciais mais prováveis
2. Exames complementares sugeridos
3. Alertas clínicos importantes
`;

  return this.geminiService.generate(prompt);
}
```

Frontend - Mostrar painel enriquecido:
- Adicionar card na página de consulta mostrando resumo dos dados do paciente
- Indicador visual quando IA está usando dados clínicos

Arquivos a modificar:
- /app/backend/src/ai/clinical-context.service.ts
- /app/backend/src/ai/ai.service.ts
- /app/src/pages/new-consultation-page.tsx
```

---

### PROMPT 6: Busca de Paciente na Página de Exames

```
Contexto do Projeto:
- Página de exames: /app/src/pages/exames/exams-page.tsx
- Atualmente lista todos os exames
- Precisa adicionar filtro/busca por paciente

Tarefa:
Adicionar autocomplete de busca por paciente na página de exames.

Frontend - Implementar:
1. Usar componente Combobox do Shadcn/UI para autocomplete
2. Buscar pacientes conforme usuário digita (debounce 300ms)
3. Filtrar exames pelo paciente selecionado
4. Mostrar chip com paciente selecionado e botão para limpar filtro

Componente de busca:
```tsx
import { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { usePatientsQuery } from '@/features/patients/use-patients-query';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const PatientSearch = ({ onSelect }: { onSelect: (patientId: string | null) => void }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const { data: patients } = usePatientsQuery(debouncedSearch);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full md:w-80 text-left px-4 py-2.5 rounded-xl border border-slate-200 bg-white">
          {selectedPatient?.fullName || 'Buscar paciente...'}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput 
            placeholder="Digite o nome..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {patients?.map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => {
                  onSelect(p.id);
                  setOpen(false);
                }}
              >
                {p.fullName}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
```

Backend - Atualizar endpoint de exames:
GET /api/v1/lab-results?patientId=xxx&search=nome

Arquivos a modificar:
- /app/src/pages/exames/exams-page.tsx
- /app/src/features/patients/use-patients-query.ts (adicionar param de busca)
- /app/backend/src/lab-results/lab-results.controller.ts (adicionar filtros)
```

---

## 🟡 P2 — MÉDIA PRIORIDADE

### PROMPT 7: Portal do Paciente como PWA

```
Contexto do Projeto:
- Portal do paciente já existe em /paciente/*
- Precisa ser transformado em PWA para uso offline

Tarefa:
Implementar Progressive Web App para o portal do paciente.

Passo 1 - Atualizar manifest.webmanifest (/app/public/manifest.webmanifest):
```json
{
  "name": "Prontuendo - Portal do Paciente",
  "short_name": "Prontuendo",
  "description": "Acompanhe sua saúde com seu endocrinologista",
  "start_url": "/paciente",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Passo 2 - Criar Service Worker (/app/public/sw.js):
```javascript
const CACHE_NAME = 'prontuendo-v1';
const urlsToCache = [
  '/paciente',
  '/paciente/glicemia',
  '/paciente/exames',
  '/paciente/perfil',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

Passo 3 - Registrar Service Worker no index.html:
```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>
```

Passo 4 - Criar ícones (usar ferramenta como realfavicongenerator.net):
- /app/public/icons/icon-192.png
- /app/public/icons/icon-512.png

Passo 5 - Adicionar banner de instalação no portal:
```tsx
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 p-4 bg-indigo-600 text-white rounded-xl">
      <p>Instale o app para acesso rápido!</p>
      <button onClick={() => deferredPrompt.prompt()}>Instalar</button>
    </div>
  );
};
```

Arquivos a criar/modificar:
- /app/public/manifest.webmanifest
- /app/public/sw.js
- /app/index.html
- /app/src/pages/patient/home-page.tsx
```

---

### PROMPT 8: Upload Real de Documentos com S3

```
Contexto do Projeto:
- Modelo Document já existe no Prisma
- DocumentsModule já existe com Multer configurado para disco local
- Precisa migrar para AWS S3

Tarefa:
Implementar upload de documentos para AWS S3.

Passo 1 - Instalar dependências:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Passo 2 - Criar S3Service (/app/backend/src/documents/s3.service.ts):
```typescript
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET;
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));
    return key;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }
}
```

Passo 3 - Atualizar DocumentsService:
```typescript
async upload(tenantId: string, patientId: string, file: Express.Multer.File, dto: CreateDocumentDto) {
  const key = `${tenantId}/${patientId}/${randomUUID()}_${file.originalname}`;
  await this.s3Service.upload(key, file.buffer, file.mimetype);
  
  return this.prisma.document.create({
    data: {
      tenantId,
      patientId,
      uploadedById: dto.uploadedById,
      category: dto.category,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageKey: key,
      description: dto.description,
    },
  });
}

async getDownloadUrl(tenantId: string, documentId: string) {
  const doc = await this.prisma.document.findFirst({ where: { id: documentId, tenantId } });
  return this.s3Service.getSignedUrl(doc.storageKey);
}
```

Passo 4 - Atualizar Multer config para usar memoryStorage:
```typescript
MulterModule.register({
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})
```

Passo 5 - Adicionar variáveis de ambiente:
```env
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_S3_BUCKET=prontuendo-documents
```

Arquivos a criar/modificar:
- /app/backend/src/documents/s3.service.ts
- /app/backend/src/documents/documents.service.ts
- /app/backend/src/documents/documents.module.ts
- /app/backend/.env
```

---

### PROMPT 9: Integração VIDaaS para Assinatura Digital ICP-Brasil

```
Contexto do Projeto:
- Sistema precisa de assinatura digital com validade jurídica
- VIDaaS é o provedor de assinatura ICP-Brasil escolhido
- Documentos PDF precisam ser assinados digitalmente

Tarefa:
Integrar VIDaaS para assinatura digital de documentos.

Passo 1 - Criar VIDaaSService (/app/backend/src/digital-signature/vidaas.service.ts):
```typescript
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class VIDaaSService {
  private baseUrl = process.env.VIDAAS_API_URL;
  private clientId = process.env.VIDAAS_CLIENT_ID;
  private clientSecret = process.env.VIDAAS_CLIENT_SECRET;

  async getAccessToken(): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });
    return response.data.access_token;
  }

  async initiateSignature(documentBase64: string, signerCpf: string): Promise<SignatureSession> {
    const token = await this.getAccessToken();
    
    const response = await axios.post(
      `${this.baseUrl}/signature/start`,
      {
        document: documentBase64,
        signerIdentifier: signerCpf,
        signatureType: 'CMS_ATTACHED',
        hashAlgorithm: 'SHA256',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return {
      sessionId: response.data.sessionId,
      authUrl: response.data.authorizationUrl,
    };
  }

  async completeSignature(sessionId: string): Promise<string> {
    const token = await this.getAccessToken();
    
    const response = await axios.post(
      `${this.baseUrl}/signature/complete`,
      { sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data.signedDocument; // Base64 do documento assinado
  }
}
```

Passo 2 - Criar endpoint de assinatura:
POST /api/v1/digital-signature/sign
Body: { documentId: string }
Response: { authUrl: string, sessionId: string }

POST /api/v1/digital-signature/complete
Body: { sessionId: string }
Response: { signedDocumentId: string }

Passo 3 - Frontend - Fluxo de assinatura:
1. Usuário clica "Assinar Documento"
2. Backend gera sessão VIDaaS e retorna URL de autenticação
3. Usuário é redirecionado para VIDaaS (autenticação com certificado)
4. VIDaaS redireciona de volta com callback
5. Backend completa assinatura e salva documento assinado

Arquivos a criar:
- /app/backend/src/digital-signature/vidaas.service.ts
- /app/backend/src/digital-signature/digital-signature.controller.ts
- /app/backend/src/digital-signature/digital-signature.module.ts
- /app/src/components/domain/sign-document-button.tsx
```

---

## 🔵 P3 — INFRAESTRUTURA

### PROMPT 10: Row Level Security (RLS) no Neon PostgreSQL

```
Contexto do Projeto:
- Banco PostgreSQL no Neon
- Multi-tenant com tenantId em todas as tabelas
- Precisa garantir isolamento de dados por tenant

Tarefa:
Implementar Row Level Security para isolamento de dados.

SQL para criar policies (/app/sql/rls-policies.sql):
```sql
-- Habilitar RLS nas tabelas principais
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Consultation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GlucoseLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LabResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BioimpedanceExam" ENABLE ROW LEVEL SECURITY;

-- Criar função para obter tenant do contexto
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
  SELECT current_setting('app.current_tenant_id', true);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Policy para Patient
CREATE POLICY tenant_isolation_patient ON "Patient"
  USING ("tenantId" = current_tenant_id());

-- Policy para Consultation
CREATE POLICY tenant_isolation_consultation ON "Consultation"
  USING ("tenantId" = current_tenant_id());

-- Policy para Prescription
CREATE POLICY tenant_isolation_prescription ON "Prescription"
  USING ("tenantId" = current_tenant_id());

-- Policy para Document
CREATE POLICY tenant_isolation_document ON "Document"
  USING ("tenantId" = current_tenant_id());

-- Policy para Appointment
CREATE POLICY tenant_isolation_appointment ON "Appointment"
  USING ("tenantId" = current_tenant_id());

-- Repetir para outras tabelas...
```

Backend - Middleware para setar tenant no contexto:
```typescript
// /app/backend/src/common/tenant-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    
    if (tenantId) {
      await this.prisma.$executeRawUnsafe(
        `SET app.current_tenant_id = '${tenantId}'`
      );
    }
    
    next();
  }
}
```

Arquivos a criar/modificar:
- /app/sql/rls-policies.sql
- /app/backend/src/common/tenant-context.middleware.ts
- /app/backend/src/app.module.ts (registrar middleware)
```

---

## ⚪ BACKLOG

### PROMPT 11: Dashboard de Analytics

```
Contexto do Projeto:
- Sistema já tem dados de consultas, pacientes, agendamentos
- Precisa de dashboard com métricas e gráficos

Tarefa:
Criar dashboard de analytics com métricas clínicas.

Métricas a implementar:
1. Consultas por período (dia/semana/mês)
2. Taxa de no-show (agendamentos cancelados)
3. Distribuição de diagnósticos (top 10)
4. Evolução de pacientes (novos vs retornos)
5. Tempo médio de consulta
6. Exames mais solicitados
7. Medicamentos mais prescritos

Backend - Criar AnalyticsService:
```typescript
@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getConsultationStats(tenantId: string, startDate: Date, endDate: Date) {
    const [total, finalized, byDay] = await Promise.all([
      this.prisma.consultation.count({ where: { tenantId, createdAt: { gte: startDate, lte: endDate } } }),
      this.prisma.consultation.count({ where: { tenantId, status: 'FINALIZED', createdAt: { gte: startDate, lte: endDate } } }),
      this.prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM "Consultation"
        WHERE tenant_id = ${tenantId}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
    ]);
    
    return { total, finalized, byDay };
  }

  async getNoShowRate(tenantId: string, startDate: Date, endDate: Date) {
    const [total, cancelled] = await Promise.all([
      this.prisma.appointment.count({ where: { tenantId, date: { gte: startDate, lte: endDate } } }),
      this.prisma.appointment.count({ where: { tenantId, status: 'CANCELADO', date: { gte: startDate, lte: endDate } } }),
    ]);
    
    return { total, cancelled, rate: total > 0 ? (cancelled / total) * 100 : 0 };
  }
}
```

Frontend - Página de Analytics:
- Usar biblioteca de gráficos: Recharts ou Chart.js
- Cards com KPIs principais
- Gráficos de linha para evolução temporal
- Gráficos de pizza/barra para distribuições
- Filtros por período

Arquivos a criar:
- /app/backend/src/analytics/analytics.service.ts
- /app/backend/src/analytics/analytics.controller.ts
- /app/backend/src/analytics/analytics.module.ts
- /app/src/pages/analytics/analytics-page.tsx
- /app/src/app/medical-router.tsx (adicionar rota)
```

---

### PROMPT 12: Integração com Google Calendar

```
Contexto do Projeto:
- Módulo de agenda já funciona com banco local
- Médicos querem sincronizar com Google Calendar

Tarefa:
Implementar sincronização bidirecional com Google Calendar.

Passo 1 - Configurar Google Cloud:
- Criar projeto no Google Cloud Console
- Habilitar Google Calendar API
- Criar credenciais OAuth 2.0
- Configurar redirect URI: https://app.exemplo.com/api/v1/integrations/google/callback

Passo 2 - Instalar dependências:
```bash
npm install googleapis
```

Passo 3 - Criar GoogleCalendarService:
```typescript
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  getAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: userId,
    });
  }

  async handleCallback(code: string): Promise<Credentials> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async syncAppointmentToGoogle(credentials: Credentials, appointment: Appointment) {
    this.oauth2Client.setCredentials(credentials);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const event = {
      summary: `Consulta: ${appointment.patientName}`,
      description: appointment.notes,
      start: {
        dateTime: `${appointment.date}T${appointment.time}:00`,
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: `${appointment.date}T${this.addHour(appointment.time)}:00`,
        timeZone: 'America/Sao_Paulo',
      },
    };
    
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
  }
}
```

Passo 4 - Salvar tokens no banco:
```prisma
model UserIntegration {
  id           String   @id @default(cuid())
  userId       String
  provider     String   // GOOGLE_CALENDAR
  credentials  Json     // OAuth tokens
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id])

  @@unique([userId, provider])
}
```

Arquivos a criar:
- /app/backend/src/integrations/google-calendar.service.ts
- /app/backend/src/integrations/integrations.controller.ts
- /app/backend/src/integrations/integrations.module.ts
- /app/src/pages/configuracoes/integrations-tab.tsx
```

---

## 🐛 BUG FIX

### PROMPT 13: Corrigir Mismatch de Campos no Autosave de Consultas

```
Contexto do Projeto:
- Frontend envia campos: {subjetivo, objetivo, avaliacao, plano}
- Backend espera: {anamnese, exameFisico, diagnostico, prescricao}
- Isso causa perda de dados no autosave

Tarefa:
Corrigir mapeamento de campos no autosave de consultas.

Opção A - Corrigir no Frontend (/app/src/lib/api/consultation-api.ts):
```typescript
export async function upsertConsultationSection(
  consultationId: string,
  section: string,
  content: { text: string }
) {
  // Mapear nomes do frontend para backend
  const sectionMap: Record<string, string> = {
    subjetivo: 'anamnese',
    objetivo: 'exameFisico',
    avaliacao: 'diagnostico',
    plano: 'prescricao',
  };
  
  const backendSection = sectionMap[section] || section;
  
  return api.patch(`/consultations/${consultationId}/sections/${backendSection}`, content);
}
```

Opção B - Corrigir no Backend (aceitar ambos os nomes):
```typescript
// /app/backend/src/consultations/consultations.service.ts
const sectionAliases: Record<string, string> = {
  subjetivo: 'anamnese',
  objetivo: 'exameFisico',
  avaliacao: 'diagnostico',
  plano: 'prescricao',
};

async upsertSection(consultationId: string, section: string, content: object) {
  const normalizedSection = sectionAliases[section] || section;
  // ... resto da lógica usando normalizedSection
}
```

Arquivos a modificar:
- /app/src/lib/api/consultation-api.ts (Opção A)
- /app/backend/src/consultations/consultations.service.ts (Opção B)
```

---

# 📌 Instruções de Uso

## Para Google AI Studio:
1. Copie o prompt desejado
2. Cole no chat do AI Studio
3. Aguarde a resposta com o código
4. Copie os arquivos gerados para o projeto
5. Teste localmente antes de fazer commit

## Para Jules (GitHub):
1. Abra uma issue no repositório com o prompt
2. Mencione @jules no comentário
3. Jules criará um PR com as mudanças
4. Revise o PR antes de fazer merge

## Para Codex (OpenAI):
1. Use o prompt como contexto inicial
2. Peça para gerar arquivo por arquivo
3. Valide cada arquivo antes de prosseguir

## Ordem Recomendada de Implementação:
1. PROMPT 13 (Bug Fix - Autosave) - Crítico
2. PROMPT 1 (Bioimpedância Modal) - P0
3. PROMPT 2 (Protocolos Prisma) - P1
4. PROMPT 4 (Histórico Versões) - P1
5. PROMPT 3 (Templates PDF) - P1
6. PROMPT 5 (IA Enriquecida) - P1
7. PROMPT 6 (Busca Exames) - P1
8. Demais prompts conforme prioridade

---

**Gerado em:** 2026-03-05
**Projeto:** EndocrinoPront Pro
**Repositório:** https://github.com/rafaellarar65-ops/Prontuendo

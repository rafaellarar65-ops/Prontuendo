import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const defaultTenantId = 'clitenant0000000000000001'
const globalTemplatesTenantId = 'globaltemplates0000000001'

type DrugTemplateSeed = {
  name: string
  group: string
}

type DocumentTemplateSeed = {
  id: string
  category: string
  name: string
  description: string
  isDefault: boolean
  thumbnailUrl: string | null
  canvasJson: Record<string, unknown>
}

const globalDrugTemplates: DrugTemplateSeed[] = [
  // Diabetes
  { name: 'Metformina', group: 'Diabetes' },
  { name: 'Sulfonilureias', group: 'Diabetes' },
  { name: 'Inibidores de DPP-4 (iDPP4)', group: 'Diabetes' },
  { name: 'Inibidores de SGLT2 (iSGLT2)', group: 'Diabetes' },
  { name: 'Insulina NPH', group: 'Diabetes' },
  { name: 'Insulina Regular', group: 'Diabetes' },
  { name: 'Insulina Glargina', group: 'Diabetes' },
  { name: 'Insulina Detemir', group: 'Diabetes' },
  { name: 'Insulina Degludeca', group: 'Diabetes' },
  { name: 'Agonistas de GLP-1', group: 'Diabetes' },

  // Tireoide
  { name: 'Levotiroxina 25 mcg', group: 'Tireoide' },
  { name: 'Levotiroxina 50 mcg', group: 'Tireoide' },
  { name: 'Levotiroxina 75 mcg', group: 'Tireoide' },
  { name: 'Levotiroxina 88 mcg', group: 'Tireoide' },
  { name: 'Levotiroxina 100 mcg', group: 'Tireoide' },
  { name: 'Levotiroxina 112 mcg', group: 'Tireoide' },
  { name: 'Levotiroxina 125 mcg', group: 'Tireoide' },
  { name: 'Levotiroxina 137 mcg', group: 'Tireoide' },
  { name: 'Levotiroxina 150 mcg', group: 'Tireoide' },
  { name: 'Propiltiouracil (PTU)', group: 'Tireoide' },
  { name: 'Tiamazol', group: 'Tireoide' },

  // Obesidade
  { name: 'Orlistate', group: 'Obesidade' },
  { name: 'Liraglutida', group: 'Obesidade' },
  { name: 'Semaglutida', group: 'Obesidade' },
  { name: 'Tirzepatida', group: 'Obesidade' },

  // Metabólica
  { name: 'Atorvastatina', group: 'Metabólica' },
  { name: 'Rosuvastatina', group: 'Metabólica' },
  { name: 'Sinvastatina', group: 'Metabólica' },
  { name: 'Fenofibrato', group: 'Metabólica' },
  { name: 'Ômega-3', group: 'Metabólica' },
  { name: 'Ezetimiba', group: 'Metabólica' },
]

const defaultDocumentTemplates: DocumentTemplateSeed[] = [
  {
    id: 'doc-template-receituario-simples',
    category: 'RECEITUARIO',
    name: 'Receituário simples',
    description: 'Modelo padrão para prescrição médica em texto livre.',
    isDefault: true,
    thumbnailUrl: null,
    canvasJson: {
      version: '1.0',
      size: { width: 794, height: 1123 },
      objects: [
        { type: 'text', x: 48, y: 36, text: 'CLÍNICA ENDOCRINOPRO', fontSize: 22, fontWeight: 'bold' },
        { type: 'text', x: 48, y: 68, text: 'Receituário Médico', fontSize: 16, fontWeight: 'bold' },
        { type: 'line', x: 48, y: 94, x2: 746, y2: 94, stroke: '#222', strokeWidth: 1 },
        { type: 'text', x: 48, y: 114, text: 'Médico(a): {{doctor.fullName}}', fontSize: 12 },
        { type: 'text', x: 420, y: 114, text: 'CRM: {{doctor.crm}}', fontSize: 12 },
        { type: 'text', x: 48, y: 136, text: 'Paciente: {{patient.fullName}}', fontSize: 12 },
        { type: 'text', x: 420, y: 136, text: 'Data: {{date}}', fontSize: 12 },
        { type: 'text', x: 48, y: 198, text: 'Prescrição', fontSize: 14, fontWeight: 'bold' },
        {
          type: 'textbox',
          x: 48,
          y: 228,
          width: 698,
          minHeight: 560,
          text: '1. {{medication_1}}\n2. {{medication_2}}\n3. {{medication_3}}',
          fontSize: 13,
          lineHeight: 1.5,
        },
        { type: 'line', x: 460, y: 930, x2: 746, y2: 930, stroke: '#222', strokeWidth: 1 },
        { type: 'text', x: 500, y: 938, text: '{{doctor.fullName}}', fontSize: 11 },
        { type: 'text', x: 500, y: 956, text: 'CRM: {{doctor.crm}}', fontSize: 11 },
      ],
    },
  },
  {
    id: 'doc-template-atestado-medico',
    category: 'ATESTADO',
    name: 'Atestado médico',
    description: 'Modelo para emissão de atestado de comparecimento e afastamento.',
    isDefault: true,
    thumbnailUrl: null,
    canvasJson: {
      version: '1.0',
      size: { width: 794, height: 1123 },
      objects: [
        { type: 'text', x: 48, y: 36, text: 'CLÍNICA ENDOCRINOPRO', fontSize: 22, fontWeight: 'bold' },
        { type: 'line', x: 48, y: 90, x2: 746, y2: 90, stroke: '#222', strokeWidth: 1 },
        { type: 'text', x: 48, y: 120, text: 'Médico(a): {{doctor.fullName}}', fontSize: 12 },
        { type: 'text', x: 420, y: 120, text: 'CRM: {{doctor.crm}}', fontSize: 12 },
        { type: 'text', x: 48, y: 142, text: 'Paciente: {{patient.fullName}}', fontSize: 12 },
        { type: 'text', x: 420, y: 142, text: 'Data: {{date}}', fontSize: 12 },
        { type: 'text', x: 290, y: 210, text: 'ATESTADO MÉDICO', fontSize: 18, fontWeight: 'bold' },
        {
          type: 'textbox',
          x: 48,
          y: 270,
          width: 698,
          minHeight: 450,
          text: 'Atesto para os devidos fins que o(a) paciente {{patient.fullName}} esteve em consulta nesta data e necessita de {{days_off}} dia(s) de afastamento de suas atividades.',
          fontSize: 13,
          lineHeight: 1.6,
        },
        { type: 'text', x: 48, y: 770, text: 'CID (opcional): {{cid}}', fontSize: 12 },
        { type: 'line', x: 460, y: 930, x2: 746, y2: 930, stroke: '#222', strokeWidth: 1 },
        { type: 'text', x: 500, y: 938, text: '{{doctor.fullName}}', fontSize: 11 },
        { type: 'text', x: 500, y: 956, text: 'CRM: {{doctor.crm}}', fontSize: 11 },
      ],
    },
  },
  {
    id: 'doc-template-solicitacao-exames',
    category: 'SOLICITACAO_EXAME',
    name: 'Solicitação de exames',
    description: 'Modelo de pedido laboratorial com espaço para lista de exames.',
    isDefault: true,
    thumbnailUrl: null,
    canvasJson: {
      version: '1.0',
      size: { width: 794, height: 1123 },
      objects: [
        { type: 'text', x: 48, y: 36, text: 'CLÍNICA ENDOCRINOPRO', fontSize: 22, fontWeight: 'bold' },
        { type: 'text', x: 48, y: 68, text: 'Solicitação de Exames', fontSize: 16, fontWeight: 'bold' },
        { type: 'line', x: 48, y: 94, x2: 746, y2: 94, stroke: '#222', strokeWidth: 1 },
        { type: 'text', x: 48, y: 114, text: 'Médico(a): {{doctor.fullName}}', fontSize: 12 },
        { type: 'text', x: 420, y: 114, text: 'CRM: {{doctor.crm}}', fontSize: 12 },
        { type: 'text', x: 48, y: 136, text: 'Paciente: {{patient.fullName}}', fontSize: 12 },
        { type: 'text', x: 420, y: 136, text: 'Data: {{date}}', fontSize: 12 },
        {
          type: 'textbox',
          x: 48,
          y: 216,
          width: 698,
          minHeight: 600,
          text: 'Exames solicitados:\n\n• {{exam_1}}\n• {{exam_2}}\n• {{exam_3}}\n• {{exam_4}}',
          fontSize: 13,
          lineHeight: 1.6,
        },
        { type: 'line', x: 460, y: 930, x2: 746, y2: 930, stroke: '#222', strokeWidth: 1 },
        { type: 'text', x: 500, y: 938, text: '{{doctor.fullName}}', fontSize: 11 },
        { type: 'text', x: 500, y: 956, text: 'CRM: {{doctor.crm}}', fontSize: 11 },
      ],
    },
  },
]

async function main() {
  const tenantId = defaultTenantId

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Clínica EndocrinoPro',
    },
  })

  const globalTemplatesTenant = await prisma.tenant.upsert({
    where: { id: globalTemplatesTenantId },
    update: {},
    create: {
      id: globalTemplatesTenantId,
      name: 'Global Templates',
    },
  })

  const doctorHash = await bcrypt.hash('12345678', 10)
  const doctor = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: 'rafaellarar65@gmail.com' } },
    update: { passwordHash: doctorHash },
    create: {
      tenantId,
      email: 'rafaellarar65@gmail.com',
      passwordHash: doctorHash,
      fullName: 'Dr. Rafael Menezes',
      role: Role.MEDICO,
    },
  })

  const receptionHash = await bcrypt.hash('Recepcao@123!', 10)
  const receptionist = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: 'recepcao@endocrinopro.com' } },
    update: { passwordHash: receptionHash },
    create: {
      tenantId,
      email: 'recepcao@endocrinopro.com',
      passwordHash: receptionHash,
      fullName: 'Ana Paula Souza',
      role: Role.RECEPCAO,
    },
  })

  const prismaAny = prisma as any
  let upsertedTemplates = 0
  let upsertedDocumentTemplates = 0

  if (prismaAny.drugTemplate) {
    // First, clean up existing global templates
    await prismaAny.drugTemplate.deleteMany({
      where: { tenantId: globalTemplatesTenantId }
    })

    // Then create new templates
    for (const template of globalDrugTemplates) {
      await prismaAny.drugTemplate.create({
        data: {
          tenantId: globalTemplatesTenantId,
          genericName: template.name,
          class: template.group,
          defaultDose: '1x/dia',
          defaultRoute: 'oral',
          defaultFreq: '1x/dia',
          isGlobal: true,
        },
      })

      upsertedTemplates += 1
    }
  }

  if (prismaAny.documentTemplate) {
    for (const template of defaultDocumentTemplates) {
      await prismaAny.documentTemplate.upsert({
        where: { id: template.id },
        update: {
          tenantId,
          category: template.category,
          name: template.name,
          description: template.description,
          isDefault: template.isDefault,
          createdBy: doctor.id,
          canvasJson: template.canvasJson,
          thumbnailUrl: template.thumbnailUrl,
        },
        create: {
          id: template.id,
          tenantId,
          category: template.category,
          name: template.name,
          description: template.description,
          isDefault: template.isDefault,
          createdBy: doctor.id,
          canvasJson: template.canvasJson,
          thumbnailUrl: template.thumbnailUrl,
        },
      })

      upsertedDocumentTemplates += 1
    }

    const seededDocumentTemplates = await prismaAny.documentTemplate.findMany({
      where: { tenantId, id: { in: defaultDocumentTemplates.map((template) => template.id) } },
      select: { id: true, name: true, category: true },
      orderBy: { name: 'asc' },
    })

    console.log('Document templates disponíveis para listagem:', seededDocumentTemplates)
  }

  console.log('Seed concluído:', {
    tenant: tenant.name,
    globalTemplatesTenant: globalTemplatesTenant.name,
    doctor: doctor.email,
    receptionist: receptionist.email,
    globalDrugTemplates: upsertedTemplates,
    documentTemplates: upsertedDocumentTemplates,
  })
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

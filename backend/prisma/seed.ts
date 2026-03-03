import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const defaultTenantId = 'clitenant0000000000000001'
const globalTemplatesTenantId = 'globaltemplates0000000001'

type DrugTemplateSeed = {
  name: string
  group: string
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

  const doctorHash = await bcrypt.hash('crucru22', 10)
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

  if (prismaAny.drugTemplate) {
    for (const template of globalDrugTemplates) {
      await prismaAny.drugTemplate.upsert({
        where: {
          tenantId_name: {
            tenantId: globalTemplatesTenantId,
            name: template.name,
          },
        },
        update: {
          group: template.group,
          isGlobal: true,
          tenantId: globalTemplatesTenantId,
        },
        create: {
          tenantId: globalTemplatesTenantId,
          name: template.name,
          group: template.group,
          isGlobal: true,
        },
      })

      upsertedTemplates += 1
    }
  }

  console.log('Seed concluído:', {
    tenant: tenant.name,
    globalTemplatesTenant: globalTemplatesTenant.name,
    doctor: doctor.email,
    receptionist: receptionist.email,
    globalDrugTemplates: upsertedTemplates,
  })
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

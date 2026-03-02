import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const tenantId = 'clitenant0000000000000001'

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Clínica EndocrinoPro',
    },
  })

  const doctorHash = await bcrypt.hash('crucru22', 10)
  const doctor = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: 'Rafaellarar65@gmail.com' } },
    update: { passwordHash: doctorHash },
    create: {
      tenantId,
      email: 'Rafaellarar65@gmail.com',
      passwordHash: doctorHash,
      fullName: 'Dr. Rafael Menezes',
      role: 'MEDICO',
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
      role: 'RECEPCAO',
    },
  })

  console.log('Seed concluído:', {
    tenant: tenant.name,
    doctor: doctor.email,
    receptionist: receptionist.email,
  })
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

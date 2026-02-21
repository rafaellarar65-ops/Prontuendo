import { randomUUID } from 'node:crypto'
import {
  AppointmentStatus,
  BiologicalSex,
  ConsentStatus,
  ConsultationStatus,
  DocumentType,
  PrismaClient,
  ReminderChannel,
  ServiceContractType,
  ServiceType,
  SignatureStatus,
  UserRole,
} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tenantId = '11111111-1111-1111-1111-111111111111'

  const doctor = await prisma.user.create({
    data: {
      tenantId,
      email: 'dr.rafael@endocrinopro.com',
      passwordHash: 'argon2$doctor_hash',
      role: UserRole.DOCTOR,
      profile: {
        create: {
          tenantId,
          fullName: 'Dr. Rafael Menezes',
          specialty: 'Endocrinologia e Metabologia',
          crm: 'CRM-MG 123456',
          phone: '+5531999990001',
        },
      },
    },
  })

  const receptionist = await prisma.user.create({
    data: {
      tenantId,
      email: 'recepcao@endocrinopro.com',
      passwordHash: 'argon2$reception_hash',
      role: UserRole.RECEPTIONIST,
      profile: {
        create: {
          tenantId,
          fullName: 'Ana Paula Souza',
          phone: '+5531999990002',
        },
      },
    },
  })

  const clinic = await prisma.clinic.create({
    data: {
      tenantId,
      name: 'Clínica EndocrinoPro',
      phone: '+553133333000',
      color: '#3B82F6',
      address: { city: 'Belo Horizonte', state: 'MG', street: 'Av. Afonso Pena', number: '1000' },
      clinicUsers: {
        createMany: {
          data: [
            { tenantId, userId: doctor.id, roleAtClinic: UserRole.DOCTOR },
            { tenantId, userId: receptionist.id, roleAtClinic: UserRole.RECEPTIONIST },
          ],
        },
      },
    },
  })

  const services = await Promise.all([
    ['Primeira Consulta Endócrino', ServiceType.FIRST_CONSULTATION, 450, 60],
    ['Retorno Endócrino', ServiceType.FOLLOW_UP, 320, 40],
    ['Avaliação de Bioimpedância', ServiceType.EXAM, 180, 30],
    ['Consulta Nutricional Integrada', ServiceType.OTHER, 280, 45],
    ['Teleconsulta', ServiceType.FOLLOW_UP, 260, 35],
  ].map(([name, type, price, duration]) => prisma.serviceDefinition.create({
    data: {
      tenantId,
      clinicId: clinic.id,
      name: String(name),
      type: type as ServiceType,
      contractType: ServiceContractType.PRIVATE,
      price: Number(price),
      durationMinutes: Number(duration),
      color: '#2563EB',
      createdBy: doctor.id,
      updatedBy: doctor.id,
    },
  })))

  const templates = await Promise.all([
    ['Evolução Endócrino', DocumentType.REPORT],
    ['Solicitação de Exames Metabólicos', DocumentType.LAB_ORDER],
    ['Plano Terapêutico Diabetes', DocumentType.REPORT],
  ].map(([name, documentType]) => prisma.documentTemplateV2.create({
    data: {
      tenantId,
      name: String(name),
      documentType: documentType as DocumentType,
      contentJson: { blocks: [{ type: 'header', text: name }] },
      createdBy: doctor.id,
      updatedBy: doctor.id,
    },
  })))

  const patients = []
  for (let i = 1; i <= 10; i++) {
    const patient = await prisma.patient.create({
      data: {
        tenantId,
        clinicId: clinic.id,
        fullName: `Paciente ${i.toString().padStart(2, '0')} Oliveira`,
        preferredName: i % 3 === 0 ? `P${i}` : null,
        birthDate: new Date(1980 + i, i % 12, 10),
        biologicalSex: i % 2 === 0 ? BiologicalSex.FEMALE : BiologicalSex.MALE,
        cpf: `000000000${i.toString().padStart(2, '0')}`,
        rg: `${1000000 + i}`,
        whatsapp: `+55319999910${i.toString().padStart(2, '0')}`,
        email: `paciente${i}@mail.com`,
        maritalStatus: i % 2 === 0 ? 'Casado(a)' : 'Solteiro(a)',
        occupation: i % 2 === 0 ? 'Professora' : 'Analista',
        educationLevel: 'Superior Completo',
        nationality: 'Brasileira',
        naturalness: 'Belo Horizonte/MG',
        fatherName: `Pai ${i}`,
        motherName: `Mãe ${i}`,
        emergencyName: `Contato ${i}`,
        emergencyRelation: 'Cônjuge',
        emergencyPhone: `+55318888820${i.toString().padStart(2, '0')}`,
        healthPlanProvider: i % 2 === 0 ? 'Unimed' : null,
        healthPlanName: i % 2 === 0 ? 'Premium' : null,
        healthPlanNumber: i % 2 === 0 ? `UMD-${i}99` : null,
        tags: ['endocrino', i % 2 === 0 ? 'obesidade' : 'diabetes'],
        clinicalNotes: 'Paciente em acompanhamento endocrinológico regular.',
        createdBy: receptionist.id,
        updatedBy: doctor.id,
        addresses: {
          create: {
            tenantId,
            zipCode: '30140-071',
            street: 'Rua dos Pacientes',
            number: `${100 + i}`,
            complement: i % 2 === 0 ? 'Apto 201' : null,
            neighborhood: 'Centro',
            city: 'Belo Horizonte',
            state: 'MG',
            createdBy: receptionist.id,
            updatedBy: receptionist.id,
          },
        },
        consents: {
          create: {
            tenantId,
            consentType: 'LGPD_DATA_PROCESSING',
            status: ConsentStatus.GIVEN,
            acceptedAt: new Date(),
            termsVersion: 'v1.0',
            ipAddress: `177.10.10.${i}`,
            createdBy: receptionist.id,
            updatedBy: receptionist.id,
          },
        },
      },
    })

    await prisma.patientPortalAccount.create({
      data: {
        tenantId,
        patientId: patient.id,
        email: patient.email ?? `portal${i}@mail.com`,
        passwordHash: `argon2$patient_${i}_hash`,
        isActive: true,
        verifiedAt: new Date(),
        createdBy: receptionist.id,
        updatedBy: receptionist.id,
      },
    })

    patients.push(patient)
  }

  for (const patient of patients.slice(0, 3)) {
    for (let e = 0; e < 2; e++) {
      const exam = await prisma.bioimpedanceExam.create({
        data: {
          tenantId,
          patientId: patient.id,
          examDate: new Date(Date.now() - (e + 1) * 1000 * 60 * 60 * 24 * 45),
          deviceName: 'InBody 270',
          weightKg: 78 - e * 1.8,
          bodyFatPct: 32 - e * 0.7,
          muscleMassKg: 27 + e * 0.5,
          visceralFatLevel: 12 - e,
          segmentData: { trunk: { fatKg: 12.1 }, leftArm: { fatKg: 3.2 }, rightArm: { fatKg: 3.1 } },
          createdBy: doctor.id,
          updatedBy: doctor.id,
        },
      })

      await prisma.bodyCircumference.createMany({
        data: [
          { tenantId, bioimpedanceExamId: exam.id, region: 'waist', valueCm: 95 - e * 2, createdBy: doctor.id, updatedBy: doctor.id },
          { tenantId, bioimpedanceExamId: exam.id, region: 'hip', valueCm: 108 - e, createdBy: doctor.id, updatedBy: doctor.id },
        ],
      })
    }
  }

  for (const patient of patients.slice(0, 5)) {
    await prisma.glucoseTarget.create({
      data: {
        tenantId,
        patientId: patient.id,
        period: 'FASTING',
        minMgDl: 80,
        maxMgDl: 130,
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    await prisma.glucoseReminder.create({
      data: {
        tenantId,
        patientId: patient.id,
        title: 'Medição pré-café',
        channel: ReminderChannel.WHATSAPP,
        hourOfDay: '07:00',
        timezone: 'America/Sao_Paulo',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    for (let g = 0; g < 5; g++) {
      await prisma.glucoseLog.create({
        data: {
          tenantId,
          patientId: patient.id,
          measuredAt: new Date(Date.now() - g * 1000 * 60 * 60 * 24),
          glucoseMgDl: 95 + g * 4,
          context: 'FASTING',
          source: 'GlicoCare',
          createdBy: doctor.id,
          updatedBy: doctor.id,
        },
      })
    }
  }

  for (let c = 0; c < 20; c++) {
    const patient = patients[c % patients.length]
    const appointment = await prisma.appointment.create({
      data: {
        tenantId,
        clinicId: clinic.id,
        patientId: patient.id,
        doctorId: doctor.id,
        serviceId: services[c % services.length].id,
        startsAt: new Date(Date.now() + c * 1000 * 60 * 45),
        endsAt: new Date(Date.now() + c * 1000 * 60 * 45 + 1000 * 60 * 40),
        status: c < 10 ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED,
        createdBy: receptionist.id,
        updatedBy: receptionist.id,
      },
    })

    const consultation = await prisma.consultation.create({
      data: {
        tenantId,
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: appointment.id,
        consultationDate: new Date(Date.now() - c * 1000 * 60 * 60 * 24 * 7),
        versionGroupId: randomUUID(),
        versionNumber: 1,
        status: ConsultationStatus.COMPLETED,
        reason: 'Acompanhamento metabólico',
        aiSummary: 'Paciente com evolução favorável e melhora de adesão.',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    await prisma.sOAPRecord.create({
      data: {
        tenantId,
        consultationId: consultation.id,
        subjective: 'Refere melhora no controle glicêmico.',
        objective: 'Sem intercorrências no exame físico geral.',
        assessment: 'DM2 em acompanhamento, resposta parcial ao plano.',
        plan: 'Manter conduta e repetir exames laboratoriais em 3 meses.',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    await prisma.anamnesisRecord.create({
      data: {
        tenantId,
        consultationId: consultation.id,
        chiefComplaint: 'Retorno de acompanhamento',
        historyPresentIllness: 'Controle glicêmico oscilante com melhora recente.',
        pastIllnesses: 'Hipertensão arterial sistêmica.',
        allergies: 'Nega alergias medicamentosas.',
        currentMeds: 'Metformina 850mg 2x/dia',
        lifestyleData: { activity: '3x semana', sleep: '6-7h/noite' },
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    await prisma.physicalExam.create({
      data: {
        tenantId,
        consultationId: consultation.id,
        bloodPressure: '128x82 mmHg',
        heartRate: '72 bpm',
        weightKg: 82.4,
        heightCm: 168,
        bmi: 29.2,
        narrativeText: 'Sem alterações relevantes em sistemas.',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    await prisma.diagnosis.create({
      data: {
        tenantId,
        consultationId: consultation.id,
        cid10Code: 'E11',
        diagnosisText: 'Diabetes mellitus tipo 2 sem complicações.',
        riskLevel: 'medium',
        isPrimary: true,
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    const prescription = await prisma.prescription.create({
      data: {
        tenantId,
        patientId: patient.id,
        consultationId: consultation.id,
        notes: 'Uso contínuo.',
        status: 'ACTIVE',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    await prisma.prescriptionItem.create({
      data: {
        tenantId,
        prescriptionId: prescription.id,
        medicationName: 'Metformina',
        dosage: '850 mg',
        frequency: '12/12h',
        instructions: 'Tomar após refeições principais.',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    const medicalDoc = await prisma.medicalDocument.create({
      data: {
        tenantId,
        patientId: patient.id,
        consultationId: consultation.id,
        templateId: templates[0].id,
        documentType: DocumentType.REPORT,
        title: `Relatório clínico ${c + 1}`,
        contentJson: { consultationId: consultation.id, summary: 'Resumo clínico estruturado.' },
        status: 'FINAL',
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })

    await prisma.documentSignature.create({
      data: {
        tenantId,
        documentId: medicalDoc.id,
        signerUserId: doctor.id,
        signedAt: new Date(),
        status: SignatureStatus.SIGNED,
        certificateData: { provider: 'ICP-Brasil', serial: `SER-${c + 1}` },
        createdBy: doctor.id,
        updatedBy: doctor.id,
      },
    })
  }

  console.log('Seed concluído com sucesso.', {
    doctor: doctor.email,
    clinic: clinic.name,
    services: services.length,
    templates: templates.length,
    patients: patients.length,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicalContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string, patientId: string) {
    const [patient, consultations, labResults, glucoseLogs, prescriptions] = await Promise.all([
      this.prisma.patient.findFirst({
        where: { tenantId, id: patientId },
        select: { id: true, fullName: true, birthDate: true, sex: true, tags: true },
      }),
      this.prisma.consultation.findMany({
        where: { tenantId, patientId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, status: true, updatedAt: true },
      }),
      this.prisma.labResult.findMany({
        where: { tenantId, patientId },
        orderBy: { resultDate: 'desc' },
        take: 5,
        select: { id: true, examName: true, value: true, unit: true, resultDate: true },
      }),
      this.prisma.glucoseLog.findMany({
        where: { tenantId, patientId },
        orderBy: { measuredAt: 'desc' },
        take: 10,
        select: { id: true, measuredAt: true, value: true },
      }),
      this.prisma.prescription.findMany({
        where: { tenantId, patientId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          items: {
            take: 10,
            select: {
              id: true,
              medicationName: true,
            },
          },
        },
      }),
    ]);

    return {
      patient: patient
        ? {
            id: patient.id,
            birthDate: patient.birthDate,
            sex: patient.sex,
            tags: patient.tags,
          }
        : null,
      consultations,
      labResults,
      glucoseLogs,
      prescriptions: prescriptions.map((prescription) => ({
        id: prescription.id,
        status: prescription.status,
        createdAt: prescription.createdAt,
        medicationCount: prescription.items.length,
        medications: prescription.items.map((item) => item.medicationName),
      })),
    };
  }
}

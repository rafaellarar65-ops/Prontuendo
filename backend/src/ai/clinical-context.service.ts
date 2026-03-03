import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicalContextService {
  constructor(private readonly prisma: PrismaService) {}

  async buildContext(tenantId: string, patientId: string) {
    const [patient, recentConsultation, recentLabs, recentGlucose, recentPrescription] = await Promise.all([
      this.prisma.patient.findFirst({
        where: { tenantId, id: patientId },
        select: {
          id: true,
          fullName: true,
          birthDate: true,
          sex: true,
          lifecycle: true,
          notes: true,
        },
      }),
      this.prisma.consultation.findFirst({
        where: { tenantId, patientId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          latestDraft: true,
        },
      }),
      this.prisma.labResult.findMany({
        where: { tenantId, patientId },
        orderBy: { resultDate: 'desc' },
        take: 5,
        select: {
          examName: true,
          value: true,
          unit: true,
          resultDate: true,
        },
      }),
      this.prisma.glucoseLog.findMany({
        where: { tenantId, patientId },
        orderBy: { measuredAt: 'desc' },
        take: 10,
        select: {
          value: true,
          measuredAt: true,
          notes: true,
        },
      }),
      this.prisma.prescription.findFirst({
        where: { tenantId, patientId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          notes: true,
          items: {
            select: {
              medicationName: true,
              dosage: true,
              frequency: true,
              route: true,
            },
          },
        },
      }),
    ]);

    return {
      patient,
      recentConsultation,
      recentLabs,
      recentGlucose,
      recentPrescription,
    };
  }
}

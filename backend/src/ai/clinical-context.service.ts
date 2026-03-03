import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type GlucoseTrend = 'up' | 'down' | 'stable';

export interface ClinicalContext {
  patient?: {
    id: string;
    age?: number | null;
    sex?: string | null;
  };
  glucoseLog?: {
    latestReadings?: Array<{
      id: string;
      value: number;
      measuredAt: Date;
      notes?: string | null;
    }>;
    summary?: {
      average?: number | null;
      standardDeviation?: number | null;
      timeInRange70to180?: number | null;
      estimatedHba1c?: number | null;
      trend?: GlucoseTrend;
      count?: number;
      sampled?: boolean;
    };
  };
  labResult?: Array<{
    examName: string;
    value: number;
    unit?: string | null;
    resultDate: Date;
  }>;
  bioimpedanceExam?: {
    measuredAt?: Date;
    weightKg?: number | null;
    bodyFatPct?: number | null;
    muscleMassKg?: number | null;
  };
  consultations?: Array<{
    id: string;
    createdAt: Date;
    status: string;
    diagnosisA?: string | null;
  }>;
  prescriptions?: Array<{
    id: string;
    status: string;
    validUntil?: Date | null;
    notes?: string | null;
    items: Array<{
      id: string;
      medicationName: string;
      dosage: string;
      frequency: string;
      route?: string | null;
      duration?: string | null;
      instructions?: string | null;
      quantity?: number | null;
      unit?: string | null;
      sortOrder: number;
    }>;
  }>;
  availability?: {
    patientCount: number;
    glucoseCount: number;
    glucoseReadingsReturned: number;
    labResultCount: number;
    consultationCount: number;
    prescriptionCount: number;
    bioimpedanceCount: number;
  };
}

@Injectable()
export class ClinicalContextService {
  private static readonly GLUCOSE_RECENT_READINGS_LIMIT = 30;
  private static readonly GLUCOSE_STATS_SAMPLE_LIMIT = 500;

  constructor(private readonly prisma: PrismaService) {}

  async buildContext(tenantId: string, patientId: string): Promise<ClinicalContext> {
    const [patient, glucoseLog, labResult, bioimpedanceExam, consultations, prescriptions] = await Promise.all([
      this.prisma.patient.findFirst({
        where: { id: patientId, tenantId },
        select: { id: true, birthDate: true, sex: true },
      }),
      this.fetchGlucoseContext(tenantId, patientId),
      this.fetchLatestLabResultsByExam(tenantId, patientId),
      this.prisma.bioimpedanceExam.findFirst({
        where: { tenantId, patientId },
        orderBy: { measuredAt: 'desc' },
        select: {
          measuredAt: true,
          weightKg: true,
          bodyFatPct: true,
          muscleMassKg: true,
        },
      }),
      this.prisma.consultation.findMany({
        where: { tenantId, patientId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          createdAt: true,
          status: true,
          latestDraft: true,
        },
      }),
      this.prisma.prescription.findMany({
        where: { tenantId, patientId, status: 'ATIVA' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          validUntil: true,
          notes: true,
          items: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              medicationName: true,
              dosage: true,
              frequency: true,
              route: true,
              duration: true,
              instructions: true,
              quantity: true,
              unit: true,
              sortOrder: true,
            },
          },
        },
      }),
    ]);

    return {
      patient: patient
        ? {
            id: patient.id,
            age: this.calculateAge(patient.birthDate),
            sex: patient.sex,
          }
        : undefined,
      glucoseLog: glucoseLog.payload,
      labResult,
      bioimpedanceExam: bioimpedanceExam ?? undefined,
      consultations: consultations.map((consultation) => ({
        id: consultation.id,
        createdAt: consultation.createdAt,
        status: consultation.status,
        diagnosisA: this.extractDiagnosisA(consultation.latestDraft),
      })),
      prescriptions,
      availability: {
        patientCount: patient ? 1 : 0,
        glucoseCount: glucoseLog.totalCount,
        glucoseReadingsReturned: glucoseLog.payload.latestReadings?.length ?? 0,
        labResultCount: labResult.length,
        consultationCount: consultations.length,
        prescriptionCount: prescriptions.length,
        bioimpedanceCount: bioimpedanceExam ? 1 : 0,
      },
    };
  }

  private async fetchGlucoseContext(tenantId: string, patientId: string) {
    const [totalCount, latestReadings, statsReadings] = await Promise.all([
      this.prisma.glucoseLog.count({ where: { tenantId, patientId } }),
      this.prisma.glucoseLog.findMany({
        where: { tenantId, patientId },
        orderBy: { measuredAt: 'desc' },
        take: ClinicalContextService.GLUCOSE_RECENT_READINGS_LIMIT,
        select: {
          id: true,
          value: true,
          measuredAt: true,
          notes: true,
        },
      }),
      this.prisma.glucoseLog.findMany({
        where: { tenantId, patientId },
        orderBy: { measuredAt: 'desc' },
        take: ClinicalContextService.GLUCOSE_STATS_SAMPLE_LIMIT,
        select: {
          value: true,
          measuredAt: true,
        },
      }),
    ]);

    const values = statsReadings.map((entry) => entry.value);
    const average = this.average(values);
    const standardDeviation = this.standardDeviation(values, average);
    const timeInRange70to180 = this.timeInRange(values, 70, 180);
    const estimatedHba1c = average !== null ? (average + 46.7) / 28.7 : null;
    const trend = this.glucoseTrend(statsReadings);

    return {
      totalCount,
      payload: {
        latestReadings,
        summary: {
          average,
          standardDeviation,
          timeInRange70to180,
          estimatedHba1c,
          trend,
          count: totalCount,
          sampled: totalCount > ClinicalContextService.GLUCOSE_STATS_SAMPLE_LIMIT,
        },
      },
    };
  }

  private async fetchLatestLabResultsByExam(tenantId: string, patientId: string) {
    const orderedResults = await this.prisma.labResult.findMany({
      where: { tenantId, patientId },
      orderBy: [{ examName: 'asc' }, { resultDate: 'desc' }],
      select: {
        examName: true,
        value: true,
        unit: true,
        resultDate: true,
      },
    });

    const latestByExam = new Map<string, (typeof orderedResults)[number]>();

    for (const result of orderedResults) {
      if (!latestByExam.has(result.examName)) {
        latestByExam.set(result.examName, result);
      }
    }

    return Array.from(latestByExam.values());
  }

  private extractDiagnosisA(latestDraft: unknown): string | null {
    if (!latestDraft || typeof latestDraft !== 'object') {
      return null;
    }

    const draft = latestDraft as Record<string, unknown>;
    const diagnostico = draft.diagnostico;

    if (!diagnostico || typeof diagnostico !== 'object') {
      return null;
    }

    const diagnostics = diagnostico as Record<string, unknown>;
    const campoA = diagnostics.A ?? diagnostics.a;

    if (typeof campoA === 'string') {
      return campoA;
    }

    if (campoA && typeof campoA === 'object') {
      const nested = campoA as Record<string, unknown>;
      const maybeText = nested.text ?? nested.value;
      return typeof maybeText === 'string' ? maybeText : null;
    }

    return null;
  }

  private glucoseTrend(readings: Array<{ value: number }>): GlucoseTrend {
    if (readings.length < 2) {
      return 'stable';
    }

    const latest = readings[0]?.value;
    const oldest = readings[readings.length - 1]?.value;

    if (latest === undefined || oldest === undefined) {
      return 'stable';
    }

    const delta = latest - oldest;
    return delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable';
  }

  private average(values: number[]): number | null {
    if (!values.length) {
      return null;
    }

    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  }

  private standardDeviation(values: number[], average: number | null): number | null {
    if (!values.length || average === null) {
      return null;
    }

    const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
    return Number(Math.sqrt(variance).toFixed(2));
  }

  private timeInRange(values: number[], min: number, max: number): number | null {
    if (!values.length) {
      return null;
    }

    const countInRange = values.filter((value) => value >= min && value <= max).length;
    return Number(((countInRange / values.length) * 100).toFixed(1));
  }

  private calculateAge(birthDate?: Date | null): number | null {
    if (!birthDate) {
      return null;
    }

    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  }
}

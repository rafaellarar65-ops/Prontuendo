import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientPortalService {
  constructor(private readonly prisma: PrismaService) {}

  private ensurePatientScope(requestedPatientId: string, authenticatedPatientId?: string) {
    if (!authenticatedPatientId || requestedPatientId !== authenticatedPatientId) {
      throw new UnauthorizedException('Paciente não autorizado para este recurso');
    }
  }

  myProfile(tenantId: string, patientId: string) {
    return this.prisma.patient.findFirst({
      where: { tenantId, id: patientId },
      select: { id: true, fullName: true, birthDate: true, tags: true, lifecycle: true },
    });
  }

  myGlucose(tenantId: string, patientId: string, authPatientId?: string) {
    this.ensurePatientScope(patientId, authPatientId);
    return this.prisma.glucoseLog.findMany({ where: { tenantId, patientId }, orderBy: { measuredAt: 'desc' }, take: 50 });
  }

  async createGlucose(
    tenantId: string,
    patientId: string,
    authPatientId: string | undefined,
    payload: Record<string, unknown>,
  ) {
    this.ensurePatientScope(patientId, authPatientId);
    const { value, notes, measuredAt } = payload as { value: number; notes?: string; measuredAt?: string };
    return this.prisma.glucoseLog.create({
      data: {
        tenantId,
        patientId,
        value: Number(value),
        measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
        notes: notes ?? null,
      },
    });
  }

  async myGlucoseAnalysis(tenantId: string, patientId: string, authPatientId?: string) {
    this.ensurePatientScope(patientId, authPatientId);
    const logs = await this.prisma.glucoseLog.findMany({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'desc' },
      take: 30,
    });

    if (!logs.length) {
      return { average: 0, estimatedA1c: null, timeInRange: 0, insight: null };
    }

    const values = logs.map((l) => l.value);
    const average = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    const estimatedA1c = Number(((average + 46.7) / 28.7).toFixed(1));
    const inRange = values.filter((v) => v >= 70 && v <= 180).length;
    const timeInRange = Math.round((inRange / values.length) * 100);

    const insight =
      timeInRange >= 70
        ? 'Ótimo progresso! Continue com seus horários e hidratação.'
        : 'Atenção: houve oscilação recente. Vale registrar refeições e conversar com a médica.';

    return { average, estimatedA1c, timeInRange, insight };
  }

  async myDocuments(tenantId: string, patientId: string, authPatientId?: string) {
    this.ensurePatientScope(patientId, authPatientId);

    return this.prisma.$queryRaw`
      SELECT * FROM "ActivityLog" 
      WHERE "tenantId" = ${tenantId} 
        AND "resource" = 'documents'
        AND "metadata"->>'patientId' = ${patientId}
        AND "metadata"->>'sharedWithPatient' = 'true'
      ORDER BY "createdAt" DESC
    `;
  }

  async uploadExam(
    tenantId: string,
    patientId: string,
    authPatientId: string | undefined,
    actorId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
    payload: Record<string, unknown>,
  ) {
    this.ensurePatientScope(patientId, authPatientId);

    if (!file) {
      return { status: 'error', message: 'Arquivo não enviado' };
    }

    const fileContentBase64 = file.buffer.toString('base64');

    const created = await this.prisma.activityLog.create({
      data: {
        tenantId,
        actorId,
        action: 'UPLOAD_EXAM',
        resource: 'documents',
        metadata: {
          patientId,
          name: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          fileContentBase64,
          fileUrl: `data:${file.mimetype};base64,${fileContentBase64}`,
          sharedWithPatient: true,
          isFromPortal: true,
          ...payload,
        } as any,
      },
    });

    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action: 'UPLOAD_EXAM', resource: 'patient-portal', metadata: { patientId, ...payload } as any },
    });

    return {
      id: created.id,
      status: 'received',
      patientId,
      name: file.originalname,
      date: created.createdAt,
      fileUrl: `data:${file.mimetype};base64,${fileContentBase64}`,
      isFromPortal: true,
      sharedWithPatient: true,
    };
  }

  async submitQuestionnaire(
    tenantId: string,
    patientId: string,
    authPatientId: string | undefined,
    actorId: string,
    payload: Record<string, unknown>,
  ) {
    this.ensurePatientScope(patientId, authPatientId);
    await this.prisma.activityLog.create({
      data: {
        tenantId,
        actorId,
        action: 'QUESTIONNAIRE_SUBMITTED',
        resource: 'patient-portal',
        metadata: { patientId, ...payload } as any,
      },
    });
    return { status: 'submitted', patientId };
  }
}

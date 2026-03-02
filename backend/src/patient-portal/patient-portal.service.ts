import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { deserializeJson, serializeJson } from '../utils/json.utils';

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

  async myDocuments(tenantId: string, patientId: string, authPatientId?: string) {
    this.ensurePatientScope(patientId, authPatientId);
    const logs = await this.prisma.activityLog.findMany({
      where: { tenantId, resource: 'documents' },
      orderBy: { createdAt: 'desc' },
    });
    
    // Filter manually since SQLite doesn't support JSON path queries
    return logs.filter(log => {
      const metadata = deserializeJson<{ patientId?: string }>(log.metadata);
      return metadata?.patientId === patientId;
    });
  }

  async uploadExam(tenantId: string, patientId: string, authPatientId: string | undefined, actorId: string, payload: Record<string, unknown>) {
    this.ensurePatientScope(patientId, authPatientId);
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action: 'UPLOAD_EXAM', resource: 'patient-portal', metadata: serializeJson({ patientId, ...payload }) },
    });
    return { status: 'received', patientId };
  }
}

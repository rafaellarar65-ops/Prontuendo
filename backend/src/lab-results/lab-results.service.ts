import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateLabResultDto } from './dto/create-lab-result.dto';

@Injectable()
export class LabResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, patientId: string, dto: CreateLabResultDto) {
    const result = await this.prisma.labResult.create({
      data: {
        tenantId,
        patientId,
        examName: dto.examName,
        value: dto.value,
        unit: dto.unit,
        reference: dto.reference,
        resultDate: new Date(dto.resultDate),
      },
    });

    return result;
  }

  findByPatient(tenantId: string, patientId: string, limit = 50) {
    return this.prisma.labResult.findMany({
      where: { tenantId, patientId },
      orderBy: { resultDate: 'desc' },
      take: limit,
    });
  }

  findLatest(tenantId: string, patientId: string) {
    return this.prisma.labResult.findFirst({
      where: { tenantId, patientId },
      orderBy: { resultDate: 'desc' },
    });
  }

  async extract(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    await this.audit(tenantId, actorId, 'EXTRACT_REQUEST', payload);
    return { status: 'queued', source: 'ia', entity: 'lab-results' };
  }

  private async audit(tenantId: string, actorId: string, action: string, metadata: Record<string, unknown>) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action, resource: 'lab-results', metadata: metadata as any },
    });
  }
}

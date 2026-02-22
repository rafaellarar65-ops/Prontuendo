import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBioimpedanceDto } from './dto/create-bioimpedance.dto';

@Injectable()
export class BioimpedanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, actorId: string, dto: CreateBioimpedanceDto) {
    const exam = await this.prisma.bioimpedanceExam.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        measuredAt: new Date(dto.measuredAt),
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct,
        muscleMassKg: dto.muscleMassKg,
      },
    });

    await this.audit(tenantId, actorId, 'CREATE', { examId: exam.id });
    return exam;
  }

  evolution(tenantId: string, patientId: string) {
    return this.prisma.bioimpedanceExam.findMany({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'asc' },
      select: {
        measuredAt: true,
        weightKg: true,
        bodyFatPct: true,
        muscleMassKg: true,
      },
    });
  }

  async extract(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    await this.audit(tenantId, actorId, 'EXTRACT_REQUEST', payload);
    return { status: 'queued', source: 'gemini', entity: 'bioimpedance' };
  }

  async report(tenantId: string, actorId: string, id: string) {
    await this.audit(tenantId, actorId, 'REPORT_REQUEST', { examId: id });
    return { examId: id, pdfStatus: 'queued' };
  }

  private async audit(tenantId: string, actorId: string, action: string, metadata: Record<string, unknown>) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action, resource: 'bioimpedance', metadata },
    });
  }
}

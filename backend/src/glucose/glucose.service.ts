import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGlucoseLogDto } from './dto/create-glucose-log.dto';

@Injectable()
export class GlucoseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, actorId: string, dto: CreateGlucoseLogDto) {
    const log = await this.prisma.glucoseLog.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        value: dto.value,
        measuredAt: new Date(dto.measuredAt),
        notes: dto.notes,
      },
    });

    await this.audit(tenantId, actorId, 'CREATE', { logId: log.id });
    return log;
  }

  findByPatient(tenantId: string, patientId: string) {
    return this.prisma.glucoseLog.findMany({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'asc' },
    });
  }

  async stats(tenantId: string, patientId: string) {
    const logs = await this.findByPatient(tenantId, patientId);
    if (!logs.length) {
      return { average: 0, stdDev: 0, timeInRange: 0, count: 0 };
    }

    const values = logs.map((l) => l.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + (v - average) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const inRange = values.filter((v) => v >= 70 && v <= 180).length;

    return {
      average: Number(average.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
      timeInRange: Number(((inRange / values.length) * 100).toFixed(2)),
      count: values.length,
    };
  }

  async readImage(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    await this.audit(tenantId, actorId, 'OCR_REQUEST', payload);
    return { status: 'queued', source: 'gemini', type: 'glucometer-image' };
  }

  private async audit(tenantId: string, actorId: string, action: string, metadata: Record<string, unknown>) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action, resource: 'glucose', metadata: metadata as object },
    });
  }
}

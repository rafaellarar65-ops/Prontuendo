import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGlucoseLogDto } from './dto/create-glucose-log.dto';

@Injectable()
export class GlucoseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, patientId: string, dto: CreateGlucoseLogDto, actorId?: string) {
    const log = await this.prisma.glucoseLog.create({
      data: {
        tenantId,
        patientId,
        value: dto.value,
        measuredAt: new Date(dto.measuredAt),
        notes: dto.notes,
      },
    });

    if (actorId) {
      await this.audit(tenantId, actorId, 'CREATE', { logId: log.id, patientId });
    }

    return log;
  }

  findByPatient(tenantId: string, patientId: string, limit = 50) {
    return this.prisma.glucoseLog.findMany({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });
  }

  async findLatest(tenantId: string, patientId: string) {
    const [latest] = await this.prisma.glucoseLog.findMany({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'desc' },
      take: 1,
    });

    return latest ?? null;
  }

  async analyzeGlucose(tenantId: string, patientId: string) {
    const logs = await this.prisma.glucoseLog.findMany({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'desc' },
      take: 30,
    });

    if (!logs.length) {
      return {
        average: 0,
        min: 0,
        max: 0,
        count: 0,
        lastValue: null,
        lastMeasuredAt: null,
        trend: 'stable',
      };
    }

    const values = logs.map((entry) => entry.value);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const lastValue = logs[0].value;
    const lastMeasuredAt = logs[0].measuredAt;

    const oldestValue = logs[logs.length - 1].value;
    const delta = lastValue - oldestValue;
    const trend = delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable';

    return {
      average: Number(average.toFixed(2)),
      min,
      max,
      count: values.length,
      lastValue,
      lastMeasuredAt,
      trend,
    };
  }

  private async audit(tenantId: string, actorId: string, action: string, metadata: Record<string, unknown>) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action, resource: 'glucose', metadata: metadata as any },
    });
  }
}

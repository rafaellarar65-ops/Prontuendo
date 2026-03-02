import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBioimpedanceDto } from './dto/create-bioimpedance.dto';

@Injectable()
export class BioimpedanceService {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, patientId: string, dto: CreateBioimpedanceDto) {
    return this.prisma.bioimpedanceExam.create({
      data: {
        tenantId,
        patientId,
        measuredAt: new Date(dto.measuredAt),
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct,
        muscleMassKg: dto.muscleMassKg,
        metadata: dto.metadata as any,
      },
    });
  }

  findByPatient(tenantId: string, patientId: string, limit = 50) {
    return this.prisma.bioimpedanceExam.findMany({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'desc' },
      take: limit,
    });
  }

  findLatest(tenantId: string, patientId: string) {
    return this.prisma.bioimpedanceExam.findFirst({
      where: { tenantId, patientId },
      orderBy: { measuredAt: 'desc' },
    });
  }
}

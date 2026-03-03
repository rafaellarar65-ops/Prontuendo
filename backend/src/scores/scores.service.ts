import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { CalculateScoreDto } from './dto/calculate-score.dto';
import { ListScoresDto } from './dto/list-scores.dto';

type Score = {
  id: string;
  tenantId: string;
  patientId: string;
  scoreType: string;
  clinicianId: string;
  parameters: Record<string, unknown>;
  result: number;
  createdAt: string;
};

@Injectable()
export class ScoresService {
  private readonly store: Score[] = [];

  calculate(tenantId: string, clinicianId: string, dto: CalculateScoreDto) {
    const score = this.computeScore(dto.parameters);

    const item: Score = {
      id: randomUUID(),
      tenantId,
      patientId: dto.patientId,
      scoreType: dto.scoreType,
      clinicianId,
      parameters: dto.parameters,
      result: score,
      createdAt: new Date().toISOString(),
    };

    this.store.push(item);
    return item;
  }

  list(tenantId: string, clinicianId: string, filters: ListScoresDto) {
    return this.store.filter((item) => {
      if (item.tenantId !== tenantId) {
        return false;
      }

      if (filters.patientId && item.patientId !== filters.patientId) {
        return false;
      }

      if (filters.scoreType && item.scoreType !== filters.scoreType) {
        return false;
      }

      return item.clinicianId === clinicianId;
    });
  }

  latest(tenantId: string, clinicianId: string, patientId: string) {
    const entries = this.list(tenantId, clinicianId, { patientId });
    return entries[entries.length - 1] ?? null;
  }

  private computeScore(parameters: Record<string, unknown>): number {
    return Object.values(parameters).reduce<number>((acc, value) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return acc + value;
      }

      return acc;
    }, 0);
  }
}

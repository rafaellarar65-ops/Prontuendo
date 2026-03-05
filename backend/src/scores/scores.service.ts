import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { BmiDto } from './dto/bmi.dto';
import { BmrDto } from './dto/bmr.dto';
import { CkdEpiDto } from './dto/ckd-epi.dto';
import { FindriscDto } from './dto/findrisc.dto';
import { HomaIrDto } from './dto/homa-ir.dto';
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

  calculateHomaIr(tenantId: string, clinicianId: string, patientId: string, dto: HomaIrDto) {
    const result = (dto.fastingGlucose * dto.fastingInsulin) / 405;
    return this.saveScore(tenantId, clinicianId, patientId, 'homa-ir', { ...dto }, result);
  }

  calculateBmi(tenantId: string, clinicianId: string, patientId: string, dto: BmiDto) {
    const result = dto.weightKg / (dto.heightM * dto.heightM);
    return this.saveScore(tenantId, clinicianId, patientId, 'bmi', { ...dto }, result);
  }

  calculateFindrisc(tenantId: string, clinicianId: string, patientId: string, dto: FindriscDto) {
    const result =
      dto.ageScore +
      dto.bmiScore +
      dto.waistScore +
      dto.physicalActivityScore +
      dto.fruitsVegetablesScore +
      dto.antiHypertensiveScore +
      dto.highGlucoseHistoryScore +
      dto.familyHistoryScore;

    return this.saveScore(tenantId, clinicianId, patientId, 'findrisc', { ...dto }, result);
  }

  calculateBmr(tenantId: string, clinicianId: string, patientId: string, dto: BmrDto) {
    const base = 10 * dto.weightKg + 6.25 * dto.heightCm - 5 * dto.age;
    const result = dto.sex === 'male' ? base + 5 : base - 161;

    return this.saveScore(tenantId, clinicianId, patientId, 'bmr', { ...dto }, result);
  }

  calculateCkdEpi(tenantId: string, clinicianId: string, patientId: string, dto: CkdEpiDto) {
    const k = dto.sex === 'female' ? 0.7 : 0.9;
    const alpha = dto.sex === 'female' ? -0.241 : -0.302;
    const sexFactor = dto.sex === 'female' ? 1.012 : 1;
    const scrByK = dto.creatinine / k;
    const result =
      142 *
      Math.pow(Math.min(scrByK, 1), alpha) *
      Math.pow(Math.max(scrByK, 1), -1.2) *
      Math.pow(0.9938, dto.age) *
      sexFactor;

    return this.saveScore(tenantId, clinicianId, patientId, 'ckd-epi', { ...dto }, result);
  }

  history(tenantId: string, clinicianId: string, patientId: string, scoreName: string) {
    return this.list(tenantId, clinicianId, {
      patientId,
      scoreType: scoreName,
    });
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

  private saveScore(
    tenantId: string,
    clinicianId: string,
    patientId: string,
    scoreType: string,
    parameters: Record<string, unknown>,
    result: number,
  ) {
    const item: Score = {
      id: randomUUID(),
      tenantId,
      patientId,
      scoreType,
      clinicianId,
      parameters,
      result,
      createdAt: new Date().toISOString(),
    };

    this.store.push(item);
    return item;
  }
}

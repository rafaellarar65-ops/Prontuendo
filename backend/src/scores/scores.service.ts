import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

type ScoreType =
  | 'HOMA_IR'
  | 'HOMA_BETA'
  | 'FINDRISC'
  | 'IMC'
  | 'WAIST_RISK'
  | 'HBA1C_ESTIMATE'
  | 'DOSE_INSULINA';

type NumericResult = {
  value: number;
  interpretation: string;
  risk?: string;
  category?: string;
};

type InsulinDoseResult = NumericResult & {
  instruction: string;
  basalDose: number;
  bolusDose: number;
  bolusPerMeal: number;
};

type ScoreResult = NumericResult | InsulinDoseResult;

const SCORE_TYPES: ScoreType[] = ['HOMA_IR', 'HOMA_BETA', 'FINDRISC', 'IMC', 'WAIST_RISK', 'HBA1C_ESTIMATE', 'DOSE_INSULINA'];

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const readNumber = (inputs: Record<string, unknown>, field: string, options?: { min?: number; max?: number; gt?: number }) => {
  const raw = inputs[field];
  if (!isFiniteNumber(raw)) {
    throw new BadRequestException(`Campo obrigatório inválido: ${field}`);
  }

  if (options?.min !== undefined && raw < options.min) {
    throw new BadRequestException(`Campo ${field} deve ser >= ${options.min}`);
  }

  if (options?.max !== undefined && raw > options.max) {
    throw new BadRequestException(`Campo ${field} deve ser <= ${options.max}`);
  }

  if (options?.gt !== undefined && raw <= options.gt) {
    throw new BadRequestException(`Campo ${field} deve ser > ${options.gt}`);
  }

  return raw;
};

const readBoolean = (inputs: Record<string, unknown>, field: string) => {
  const raw = inputs[field];
  if (typeof raw !== 'boolean') {
    throw new BadRequestException(`Campo obrigatório inválido: ${field}`);
  }

  return raw;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export const calculateHomaIr = (inputs: Record<string, unknown>): NumericResult => {
  const glucoseMgDl = readNumber(inputs, 'glucoseMgDl', { gt: 0, max: 1000 });
  const insulin = readNumber(inputs, 'insulinMicroUiMl', { gt: 0, max: 500 });
  const value = round2((glucoseMgDl * insulin) / 405);

  if (value < 2) {
    return { value, interpretation: 'Sensibilidade à insulina preservada', risk: 'baixo', category: 'NORMAL' };
  }

  if (value < 3) {
    return { value, interpretation: 'Resistência insulínica limítrofe', risk: 'moderado', category: 'LIMÍTROFE' };
  }

  return { value, interpretation: 'Resistência insulínica elevada', risk: 'alto', category: 'ALTERADO' };
};

export const calculateHomaBeta = (inputs: Record<string, unknown>): NumericResult => {
  const glucoseMgDl = readNumber(inputs, 'glucoseMgDl', { gt: 63, max: 1000 });
  const insulin = readNumber(inputs, 'insulinMicroUiMl', { gt: 0, max: 500 });
  const denominator = glucoseMgDl - 63;

  if (denominator === 0) {
    throw new BadRequestException('Divisão por zero no cálculo de HOMA-BETA');
  }

  const value = round2((360 * insulin) / denominator);

  if (value < 40) {
    return { value, interpretation: 'Função beta-pancreática reduzida', risk: 'alto', category: 'BAIXA' };
  }

  if (value <= 100) {
    return { value, interpretation: 'Função beta-pancreática preservada', risk: 'baixo', category: 'NORMAL' };
  }

  return { value, interpretation: 'Hiperinsulinemia/hiperfunção beta', risk: 'moderado', category: 'ELEVADA' };
};

export const calculateFindrisc = (inputs: Record<string, unknown>): NumericResult => {
  const age = readNumber(inputs, 'age', { min: 1, max: 120 });
  const bmi = readNumber(inputs, 'bmi', { min: 10, max: 80 });
  const waistCm = readNumber(inputs, 'waistCm', { min: 30, max: 250 });
  const sex = inputs.sex;

  if (sex !== 'M' && sex !== 'F') {
    throw new BadRequestException('Campo obrigatório inválido: sex (use M ou F)');
  }

  const physicallyActive = readBoolean(inputs, 'physicallyActive');
  const dailyFruitsVegetables = readBoolean(inputs, 'dailyFruitsVegetables');
  const antiHypertensiveMedication = readBoolean(inputs, 'antiHypertensiveMedication');
  const highGlucoseHistory = readBoolean(inputs, 'highGlucoseHistory');
  const familyHistory = inputs.familyHistory;

  if (familyHistory !== 'NONE' && familyHistory !== 'SECOND_DEGREE' && familyHistory !== 'FIRST_DEGREE') {
    throw new BadRequestException('Campo obrigatório inválido: familyHistory');
  }

  let score = 0;

  if (age >= 45 && age <= 54) score += 2;
  else if (age >= 55 && age <= 64) score += 3;
  else if (age > 64) score += 4;

  if (bmi >= 25 && bmi < 30) score += 1;
  else if (bmi >= 30) score += 3;

  if (sex === 'M') {
    if (waistCm >= 94 && waistCm < 102) score += 3;
    else if (waistCm >= 102) score += 4;
  } else {
    if (waistCm >= 80 && waistCm < 88) score += 3;
    else if (waistCm >= 88) score += 4;
  }

  if (!physicallyActive) score += 2;
  if (!dailyFruitsVegetables) score += 1;
  if (antiHypertensiveMedication) score += 2;
  if (highGlucoseHistory) score += 5;
  if (familyHistory === 'SECOND_DEGREE') score += 3;
  if (familyHistory === 'FIRST_DEGREE') score += 5;

  if (score < 7) {
    return { value: score, interpretation: 'Baixo risco em 10 anos (~1%)', risk: 'baixo', category: 'BAIXO' };
  }

  if (score <= 11) {
    return { value: score, interpretation: 'Risco levemente elevado em 10 anos (~4%)', risk: 'leve', category: 'LEVEMENTE_ELEVADO' };
  }

  if (score <= 14) {
    return { value: score, interpretation: 'Risco moderado em 10 anos (~17%)', risk: 'moderado', category: 'MODERADO' };
  }

  if (score <= 20) {
    return { value: score, interpretation: 'Risco alto em 10 anos (~33%)', risk: 'alto', category: 'ALTO' };
  }

  return { value: score, interpretation: 'Risco muito alto em 10 anos (~50%)', risk: 'muito alto', category: 'MUITO_ALTO' };
};

export const calculateImc = (inputs: Record<string, unknown>): NumericResult => {
  const weightKg = readNumber(inputs, 'weightKg', { gt: 0, max: 500 });
  const heightM = readNumber(inputs, 'heightM', { gt: 0, max: 3 });

  if (heightM === 0) {
    throw new BadRequestException('Divisão por zero no cálculo de IMC');
  }

  const value = round2(weightKg / (heightM * heightM));

  if (value < 18.5) {
    return { value, interpretation: 'Baixo peso', category: 'BAIXO_PESO', risk: 'nutricional' };
  }

  if (value < 25) {
    return { value, interpretation: 'Eutrofia', category: 'NORMAL', risk: 'baixo' };
  }

  if (value < 30) {
    return { value, interpretation: 'Sobrepeso', category: 'SOBREPESO', risk: 'moderado' };
  }

  if (value < 35) {
    return { value, interpretation: 'Obesidade grau I', category: 'OBESIDADE_I', risk: 'alto' };
  }

  if (value < 40) {
    return { value, interpretation: 'Obesidade grau II', category: 'OBESIDADE_II', risk: 'muito alto' };
  }

  return { value, interpretation: 'Obesidade grau III', category: 'OBESIDADE_III', risk: 'muito alto' };
};

export const calculateWaistRisk = (inputs: Record<string, unknown>): NumericResult => {
  const waistCm = readNumber(inputs, 'waistCm', { min: 30, max: 250 });
  const sex = inputs.sex;

  if (sex !== 'M' && sex !== 'F') {
    throw new BadRequestException('Campo obrigatório inválido: sex (use M ou F)');
  }

  if (sex === 'M') {
    if (waistCm < 94) return { value: waistCm, interpretation: 'Risco metabólico baixo', risk: 'baixo', category: 'NORMAL' };
    if (waistCm < 102) return { value: waistCm, interpretation: 'Risco metabólico aumentado', risk: 'moderado', category: 'AUMENTADO' };
    return { value: waistCm, interpretation: 'Risco metabólico muito aumentado', risk: 'alto', category: 'MUITO_AUMENTADO' };
  }

  if (waistCm < 80) return { value: waistCm, interpretation: 'Risco metabólico baixo', risk: 'baixo', category: 'NORMAL' };
  if (waistCm < 88) return { value: waistCm, interpretation: 'Risco metabólico aumentado', risk: 'moderado', category: 'AUMENTADO' };
  return { value: waistCm, interpretation: 'Risco metabólico muito aumentado', risk: 'alto', category: 'MUITO_AUMENTADO' };
};

export const calculateHba1cEstimate = (inputs: Record<string, unknown>): NumericResult => {
  const averageGlucoseMgDl = readNumber(inputs, 'averageGlucoseMgDl', { gt: 0, max: 1000 });
  const value = round2((averageGlucoseMgDl + 46.7) / 28.7);

  if (value < 5.7) {
    return { value, interpretation: 'Faixa de normoglicemia estimada', risk: 'baixo', category: 'NORMAL' };
  }

  if (value < 6.5) {
    return { value, interpretation: 'Faixa de pré-diabetes estimada', risk: 'moderado', category: 'PREDIABETES' };
  }

  return { value, interpretation: 'Faixa de diabetes estimada', risk: 'alto', category: 'DIABETES' };
};

export const calculateDoseInsulina = (inputs: Record<string, unknown>): InsulinDoseResult => {
  const weightKg = readNumber(inputs, 'weightKg', { gt: 0, max: 500 });
  const profile = inputs.profile;

  if (profile !== 'T1DM' && profile !== 'T2DM' && profile !== 'GESTACIONAL') {
    throw new BadRequestException('Campo obrigatório inválido: profile (T1DM, T2DM, GESTACIONAL)');
  }

  const unitsPerKg =
    profile === 'T1DM' ? readNumber(inputs, 'unitsPerKg', { min: 0.3, max: 0.8 }) :
      profile === 'T2DM' ? readNumber(inputs, 'unitsPerKg', { min: 0.2, max: 1.2 }) :
        readNumber(inputs, 'unitsPerKg', { min: 0.7, max: 1.0 });

  const totalDose = round2(weightKg * unitsPerKg);
  const basalDose = round2(totalDose * 0.5);
  const bolusDose = round2(totalDose * 0.5);
  const bolusPerMeal = round2(bolusDose / 3);

  return {
    value: totalDose,
    interpretation: 'Dose diária total estimada por peso corporal',
    category: profile,
    risk: 'requer ajuste clínico',
    basalDose,
    bolusDose,
    bolusPerMeal,
    instruction:
      `Iniciar com dose total diária estimada de ${totalDose} UI/dia (${unitsPerKg} UI/kg). ` +
      `Sugerir esquema basal-bolus: ${basalDose} UI basal + ${bolusDose} UI prandial ` +
      `(aprox. ${bolusPerMeal} UI antes de cada refeição principal). Ajustar conforme glicemias e supervisão médica.`,
  };
};

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateByType(scoreType: ScoreType, inputs: Record<string, unknown>): ScoreResult {
    switch (scoreType) {
      case 'HOMA_IR':
        return calculateHomaIr(inputs);
      case 'HOMA_BETA':
        return calculateHomaBeta(inputs);
      case 'FINDRISC':
        return calculateFindrisc(inputs);
      case 'IMC':
        return calculateImc(inputs);
      case 'WAIST_RISK':
        return calculateWaistRisk(inputs);
      case 'HBA1C_ESTIMATE':
        return calculateHba1cEstimate(inputs);
      case 'DOSE_INSULINA':
        return calculateDoseInsulina(inputs);
      default:
        throw new BadRequestException(`Score type inválido: ${scoreType as string}`);
    }
  }

  async calculateAndSave(
    tenantId: string,
    clinicianId: string,
    patientId: string,
    scoreType: ScoreType,
    inputs: Record<string, unknown>,
  ) {
    if (!SCORE_TYPES.includes(scoreType)) {
      throw new BadRequestException(`Score type inválido: ${scoreType}`);
    }

    const result = this.calculateByType(scoreType, inputs);

    return this.prisma.clinicalScore.create({
      data: {
        tenantId,
        clinicianId,
        patientId,
        scoreType,
        inputs: inputs as Prisma.InputJsonValue,
        result: result as Prisma.InputJsonValue,
      },
    });
  }

  async history(tenantId: string, patientId: string, scoreType?: ScoreType) {
    return this.prisma.clinicalScore.findMany({
      where: {
        tenantId,
        patientId,
        ...(scoreType ? { scoreType } : {}),
      },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async latestByType(tenantId: string, patientId: string) {
    const rows = await this.prisma.clinicalScore.findMany({
      where: { tenantId, patientId },
      orderBy: { calculatedAt: 'desc' },
    });

    const latest = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!latest.has(row.scoreType)) {
        latest.set(row.scoreType, row);
      }
    }

    return Array.from(latest.values());
  }

  async list(tenantId: string) {
    return this.prisma.clinicalScore.findMany({
      where: { tenantId },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async create(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const scoreType = payload.scoreType;
    const patientId = payload.patientId;
    const inputs = payload.inputs;

    if (typeof scoreType !== 'string' || !SCORE_TYPES.includes(scoreType as ScoreType)) {
      throw new BadRequestException('payload.scoreType inválido');
    }

    if (typeof patientId !== 'string' || patientId.length === 0) {
      throw new BadRequestException('payload.patientId obrigatório');
    }

    if (!inputs || typeof inputs !== 'object' || Array.isArray(inputs)) {
      throw new BadRequestException('payload.inputs obrigatório');
    }

    return this.calculateAndSave(tenantId, actorId, patientId, scoreType as ScoreType, inputs as Record<string, unknown>);
  }

  async update(tenantId: string, id: string, payload: Record<string, unknown>) {
    return this.prisma.clinicalScore.updateMany({
      where: { id, tenantId },
      data: {
        inputs: payload.inputs as Prisma.InputJsonValue | undefined,
        result: payload.result as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const deleted = await this.prisma.clinicalScore.deleteMany({ where: { id, tenantId } });
    return { deleted: deleted.count > 0 };
  }

  async execute(action: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    if (action === 'add-result') {
      const scoreType = payload.scoreType;
      const patientId = payload.patientId;
      const inputs = payload.inputs;

      if (typeof scoreType !== 'string' || typeof patientId !== 'string' || !inputs || typeof inputs !== 'object' || Array.isArray(inputs)) {
        throw new BadRequestException('payload inválido para add-result');
      }

      return this.calculateAndSave(tenantId, actorId, patientId, scoreType as ScoreType, inputs as Record<string, unknown>);
    }

    return { action, tenantId, actorId, status: 'queued', payload };
  }
}

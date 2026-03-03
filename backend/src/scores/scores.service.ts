import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CalculateScoreDto } from './dto/calculate-score.dto';
import { ListScoresDto } from './dto/list-scores.dto';

type ScoreResponse = {
  scoreName: string;
  scoreValue: number;
  classification: string;
  calculatedAt: Date;
  inputData: Record<string, unknown>;
};

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(tenantId: string, clinicianId: string, dto: CalculateScoreDto) {
    const scoreType = dto.scoreType.toUpperCase();

    if (scoreType === 'HOMA-IR') {
      return this.calculateHOMAIR(tenantId, dto.patientId, clinicianId);
    }

    if (scoreType === 'FINDRISC') {
      return this.calculateFINDRISC(tenantId, dto.patientId, dto.parameters, clinicianId);
    }

    if (scoreType === 'BMI' || scoreType === 'IMC') {
      return this.calculateBMI(tenantId, dto.patientId, clinicianId);
    }

    if (scoreType === 'BMR' || scoreType === 'TMB') {
      return this.calculateBasalMetabolicRate(tenantId, dto.patientId, clinicianId);
    }

    if (scoreType === 'CKD-EPI' || scoreType === 'CKDEPI') {
      return this.calculateCKDEPI(tenantId, dto.patientId, clinicianId);
    }

    throw new BadRequestException(`Tipo de score não suportado: ${dto.scoreType}.`);
  }

  async calculateHOMAIR(tenantId: string, patientId: string, calculatedBy: string): Promise<ScoreResponse> {
    const [glycemia, insulin] = await Promise.all([
      this.prisma.labResult.findFirst({
        where: {
          tenantId,
          patientId,
          examName: { contains: 'glicemia', mode: 'insensitive' },
        },
        orderBy: [{ resultDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.labResult.findFirst({
        where: {
          tenantId,
          patientId,
          examName: { contains: 'insulina', mode: 'insensitive' },
        },
        orderBy: [{ resultDate: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    if (!glycemia || !insulin) {
      throw new BadRequestException('Faltam exames/dados para calcular HOMA-IR: são necessários glicemia e insulina.');
    }

    const scoreValue = Number(((glycemia.value * insulin.value) / 405).toFixed(2));
    const classification =
      scoreValue < 1 ? 'normal' : scoreValue <= 2.5 ? 'resistência à insulina leve/moderada' : 'resistência à insulina elevada';

    return this.saveScore({
      tenantId,
      patientId,
      scoreName: 'HOMA-IR',
      scoreValue,
      classification,
      calculatedBy,
      inputData: {
        glicemia: {
          examName: glycemia.examName,
          value: glycemia.value,
          unit: glycemia.unit,
          resultDate: glycemia.resultDate,
        },
        insulina: {
          examName: insulin.examName,
          value: insulin.value,
          unit: insulin.unit,
          resultDate: insulin.resultDate,
        },
      },
    });
  }

  async calculateFINDRISC(
    tenantId: string,
    patientId: string,
    answers: Record<string, unknown>,
    calculatedBy: string,
  ): Promise<ScoreResponse> {
    const scoreValue = Object.values(answers).reduce<number>((acc, answer) => {
      if (typeof answer === 'number' && Number.isFinite(answer)) {
        return acc + answer;
      }

      return acc;
    }, 0);

    const classification =
      scoreValue < 7
        ? 'baixo risco'
        : scoreValue < 12
          ? 'risco levemente elevado'
          : scoreValue < 15
            ? 'risco moderado'
            : scoreValue < 20
              ? 'alto risco'
              : 'risco muito alto';

    return this.saveScore({
      tenantId,
      patientId,
      scoreName: 'FINDRISC',
      scoreValue,
      classification,
      calculatedBy,
      inputData: { answers },
    });
  }

  async calculateBMI(tenantId: string, patientId: string, calculatedBy: string): Promise<ScoreResponse> {
    const [patient, latestExam] = await Promise.all([
      this.prisma.patient.findFirst({ where: { tenantId, id: patientId } }),
      this.prisma.bioimpedanceExam.findFirst({
        where: { tenantId, patientId },
        orderBy: [{ measuredAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    if (!latestExam?.weightKg) {
      throw new BadRequestException('Faltam exames/dados para calcular BMI: peso não encontrado em bioimpedância.');
    }

    const heightCm = this.extractHeightCm(patient?.notes);
    if (!heightCm) {
      throw new BadRequestException('Faltam exames/dados para calcular BMI: altura ausente no cadastro do paciente.');
    }

    const heightM = heightCm / 100;
    const scoreValue = Number((latestExam.weightKg / (heightM * heightM)).toFixed(2));
    const classification =
      scoreValue < 18.5
        ? 'baixo peso'
        : scoreValue < 25
          ? 'eutrofia'
          : scoreValue < 30
            ? 'sobrepeso'
            : scoreValue < 35
              ? 'obesidade grau I'
              : scoreValue < 40
                ? 'obesidade grau II'
                : 'obesidade grau III';

    return this.saveScore({
      tenantId,
      patientId,
      scoreName: 'BMI',
      scoreValue,
      classification,
      calculatedBy,
      inputData: {
        weightKg: latestExam.weightKg,
        weightMeasuredAt: latestExam.measuredAt,
        heightCm,
      },
    });
  }

  async calculateBasalMetabolicRate(tenantId: string, patientId: string, calculatedBy: string): Promise<ScoreResponse> {
    const [patient, latestExam] = await Promise.all([
      this.prisma.patient.findFirst({ where: { tenantId, id: patientId } }),
      this.prisma.bioimpedanceExam.findFirst({
        where: { tenantId, patientId },
        orderBy: [{ measuredAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    if (!latestExam?.weightKg) {
      throw new BadRequestException('Faltam exames/dados para calcular BMR: peso não encontrado em bioimpedância.');
    }

    const heightCm = this.extractHeightCm(patient?.notes);
    if (!heightCm) {
      throw new BadRequestException('Faltam exames/dados para calcular BMR: altura ausente no cadastro do paciente.');
    }

    const age = this.getAge(patient?.birthDate);
    if (age === null) {
      throw new BadRequestException('Faltam exames/dados para calcular BMR: data de nascimento ausente no cadastro do paciente.');
    }

    const sex = (patient?.sex ?? 'NI').toUpperCase();
    const isFemale = sex.startsWith('F');
    const scoreValue = Number(
      (
        isFemale
          ? 10 * latestExam.weightKg + 6.25 * heightCm - 5 * age - 161
          : 10 * latestExam.weightKg + 6.25 * heightCm - 5 * age + 5
      ).toFixed(2),
    );

    return this.saveScore({
      tenantId,
      patientId,
      scoreName: 'BMR',
      scoreValue,
      classification: `${isFemale ? 'feminino' : 'masculino/indefinido'} - Mifflin-St Jeor`,
      calculatedBy,
      inputData: {
        weightKg: latestExam.weightKg,
        weightMeasuredAt: latestExam.measuredAt,
        heightCm,
        age,
        sex,
      },
    });
  }

  async calculateCKDEPI(tenantId: string, patientId: string, calculatedBy: string): Promise<ScoreResponse> {
    const [patient, creatinine] = await Promise.all([
      this.prisma.patient.findFirst({ where: { tenantId, id: patientId } }),
      this.prisma.labResult.findFirst({
        where: {
          tenantId,
          patientId,
          OR: [
            { examName: { contains: 'creatinina', mode: 'insensitive' } },
            { examName: { contains: 'creatinine', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ resultDate: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    if (!creatinine) {
      throw new BadRequestException('Faltam exames/dados para calcular CKD-EPI: creatinina sérica não encontrada.');
    }

    const age = this.getAge(patient?.birthDate);
    if (age === null) {
      throw new BadRequestException('Faltam exames/dados para calcular CKD-EPI: data de nascimento ausente no cadastro do paciente.');
    }

    const sex = (patient?.sex ?? 'NI').toUpperCase();
    const isFemale = sex.startsWith('F');
    const k = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const sexFactor = isFemale ? 1.012 : 1;
    const scr = creatinine.value;

    const scoreValue = Number(
      (142 * Math.pow(Math.min(scr / k, 1), alpha) * Math.pow(Math.max(scr / k, 1), -1.2) * Math.pow(0.9938, age) * sexFactor).toFixed(
        2,
      ),
    );

    const classification =
      scoreValue >= 90
        ? 'G1 - normal/alto'
        : scoreValue >= 60
          ? 'G2 - levemente reduzido'
          : scoreValue >= 45
            ? 'G3a - redução leve/moderada'
            : scoreValue >= 30
              ? 'G3b - redução moderada/importante'
              : scoreValue >= 15
                ? 'G4 - redução grave'
                : 'G5 - falência renal';

    return this.saveScore({
      tenantId,
      patientId,
      scoreName: 'CKD-EPI',
      scoreValue,
      classification,
      calculatedBy,
      inputData: {
        creatinine: {
          examName: creatinine.examName,
          value: creatinine.value,
          unit: creatinine.unit,
          resultDate: creatinine.resultDate,
        },
        age,
        sex,
      },
    });
  }

  async getScoreHistory(tenantId: string, patientId: string, scoreName?: string) {
    const entries = await this.prisma.clinicalScore.findMany({
      where: {
        tenantId,
        patientId,
        ...(scoreName ? { scoreType: scoreName } : {}),
      },
      orderBy: { calculatedAt: 'desc' },
    });

    return entries.map((entry) => this.normalizeStoredScore(entry.scoreType, entry.result, entry.inputs, entry.calculatedAt));
  }

  async list(tenantId: string, _clinicianId: string, filters: ListScoresDto) {
    if (!filters.patientId) {
      throw new BadRequestException('patientId é obrigatório para listar histórico de escores.');
    }

    return this.getScoreHistory(tenantId, filters.patientId, filters.scoreType);
  }

  async latest(tenantId: string, _clinicianId: string, patientId: string) {
    const latest = await this.prisma.clinicalScore.findFirst({
      where: { tenantId, patientId },
      orderBy: { calculatedAt: 'desc' },
    });

    if (!latest) {
      return null;
    }

    return this.normalizeStoredScore(latest.scoreType, latest.result, latest.inputs, latest.calculatedAt);
  }

  private normalizeStoredScore(
    scoreName: string,
    result: unknown,
    inputData: unknown,
    calculatedAt: Date,
  ): ScoreResponse {
    const resultObject = result as { scoreValue?: number; classification?: string };

    return {
      scoreName,
      scoreValue: resultObject.scoreValue ?? 0,
      classification: resultObject.classification ?? 'sem classificação',
      calculatedAt,
      inputData: (inputData as Record<string, unknown>) ?? {},
    };
  }

  private async saveScore(params: {
    tenantId: string;
    patientId: string;
    scoreName: string;
    scoreValue: number;
    classification: string;
    calculatedBy: string;
    inputData: Record<string, unknown>;
  }): Promise<ScoreResponse> {
    const calculatedAt = new Date();

    await this.prisma.clinicalScore.create({
      data: {
        tenantId: params.tenantId,
        patientId: params.patientId,
        scoreType: params.scoreName,
        inputs: params.inputData as Prisma.InputJsonValue,
        result: {
          scoreValue: params.scoreValue,
          classification: params.classification,
        } as Prisma.InputJsonValue,
        clinicianId: params.calculatedBy,
        calculatedAt,
      },
    });

    return {
      scoreName: params.scoreName,
      scoreValue: params.scoreValue,
      classification: params.classification,
      calculatedAt,
      inputData: params.inputData,
    };
  }

  private extractHeightCm(notes?: string | null): number | null {
    if (!notes) {
      return null;
    }

    const decimalMatch = notes.match(/altura\s*[:=]?\s*(\d+(?:[\.,]\d+)?)\s*m/i);
    if (decimalMatch) {
      return Number(decimalMatch[1].replace(',', '.')) * 100;
    }

    const cmMatch = notes.match(/altura\s*[:=]?\s*(\d+(?:[\.,]\d+)?)\s*cm/i);
    if (cmMatch) {
      return Number(cmMatch[1].replace(',', '.'));
    }

    return null;
  }

  private getAge(birthDate?: Date | null): number | null {
    if (!birthDate) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}

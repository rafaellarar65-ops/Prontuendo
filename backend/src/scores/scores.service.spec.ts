import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ScoresService } from './scores.service';

describe('ScoresService', () => {
  const prismaMock = {
    clinicalScore: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    labResult: {
      findFirst: jest.fn(),
    },
    bioimpedanceExam: {
      findFirst: jest.fn(),
    },
    patient: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve calcular HOMA-IR e persistir no banco', async () => {
    prismaMock.labResult.findFirst
      .mockResolvedValueOnce({ examName: 'Glicemia jejum', value: 90, unit: 'mg/dL', resultDate: new Date('2026-01-01') })
      .mockResolvedValueOnce({ examName: 'Insulina jejum', value: 8, unit: 'uUI/mL', resultDate: new Date('2026-01-01') });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ScoresService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(ScoresService);
    const score = await service.calculateHOMAIR('t1', 'p1', 'med1');

    expect(score.scoreName).toBe('HOMA-IR');
    expect(score.scoreValue).toBeCloseTo(1.78, 2);
    expect(prismaMock.clinicalScore.create).toHaveBeenCalled();
  });

  it('deve retornar erro explícito quando faltar altura para BMI', async () => {
    prismaMock.bioimpedanceExam.findFirst.mockResolvedValue({ weightKg: 75, measuredAt: new Date('2026-01-10') });
    prismaMock.patient.findFirst.mockResolvedValue({ notes: null });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ScoresService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(ScoresService);

    await expect(service.calculateBMI('t1', 'p1', 'med1')).rejects.toThrow(BadRequestException);
    await expect(service.calculateBMI('t1', 'p1', 'med1')).rejects.toThrow(
      'Faltam exames/dados para calcular BMI: altura ausente no cadastro do paciente.',
    );
  });

  it('deve listar histórico de escores normalizado', async () => {
    prismaMock.clinicalScore.findMany.mockResolvedValue([
      {
        scoreType: 'FINDRISC',
        result: { scoreValue: 8, classification: 'risco levemente elevado' },
        inputs: { answers: { age: 2 } },
        calculatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const moduleRef = await Test.createTestingModule({
      providers: [
        ScoresService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(ScoresService);
    const history = await service.getScoreHistory('t1', 'p1', 'FINDRISC');

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      scoreName: 'FINDRISC',
      scoreValue: 8,
      classification: 'risco levemente elevado',
      inputData: { answers: { age: 2 } },
    });
  });
});

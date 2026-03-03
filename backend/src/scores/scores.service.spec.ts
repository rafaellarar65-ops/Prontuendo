import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { calculateDoseInsulina, calculateHomaBeta, calculateImc, ScoresService } from './scores.service';

describe('ScoresService', () => {
  it('deve calcular e salvar score clínico', async () => {
    const create = jest.fn().mockResolvedValue({ id: 's1', scoreType: 'IMC' });
    const prismaMock = {
      clinicalScore: {
        create,
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [ScoresService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(ScoresService);
    const saved = await service.calculateAndSave('t1', 'c1', 'p1', 'IMC', { weightKg: 80, heightM: 1.7 });

    expect(saved).toEqual({ id: 's1', scoreType: 'IMC' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 't1',
          clinicianId: 'c1',
          patientId: 'p1',
          scoreType: 'IMC',
          result: expect.objectContaining({ value: expect.any(Number), interpretation: expect.any(String) }),
        }),
      }),
    );
  });

  it('deve ordenar history por calculatedAt desc', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prismaMock = {
      clinicalScore: {
        create: jest.fn(),
        findMany,
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [ScoresService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(ScoresService);
    await service.history('t1', 'p1', 'IMC');

    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', patientId: 'p1', scoreType: 'IMC' },
      orderBy: { calculatedAt: 'desc' },
    });
  });

  it('deve validar divisão por zero no HOMA-BETA', () => {
    expect(() => calculateHomaBeta({ glucoseMgDl: 63, insulinMicroUiMl: 10 })).toThrow(BadRequestException);
  });

  it('deve gerar instrução explícita para dose de insulina', () => {
    const result = calculateDoseInsulina({ weightKg: 70, profile: 'T1DM', unitsPerKg: 0.5 });

    expect(result.value).toBe(35);
    expect(result.instruction).toContain('Iniciar com dose total diária estimada');
  });

  it('deve calcular IMC com interpretação', () => {
    expect(calculateImc({ weightKg: 80, heightM: 1.8 })).toEqual(
      expect.objectContaining({
        value: 24.69,
        interpretation: 'Eutrofia',
      }),
    );
  });
});

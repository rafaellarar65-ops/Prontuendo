import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { LabResultsService } from './lab-results.service';

describe('LabResultsService', () => {
  it('deve listar resultados por paciente com tenant, limite e ordenação desc', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prismaMock = { labResult: { findMany } } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [LabResultsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(LabResultsService);
    await service.findByPatient('t1', 'p1');

    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', patientId: 'p1' },
      orderBy: { resultDate: 'desc' },
      take: 50,
    });
  });

  it('deve buscar o resultado mais recente do paciente', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prismaMock = { labResult: { findFirst } } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [LabResultsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(LabResultsService);
    await service.findLatest('t1', 'p1');

    expect(findFirst).toHaveBeenCalledWith({
      where: { tenantId: 't1', patientId: 'p1' },
      orderBy: { resultDate: 'desc' },
    });
  });
});

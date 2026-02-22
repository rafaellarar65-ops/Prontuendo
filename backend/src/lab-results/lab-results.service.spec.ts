import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { LabResultsService } from './lab-results.service';

describe('LabResultsService', () => {
  it('deve filtrar histórico por tenant', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prismaMock = { labResult: { findMany } } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [LabResultsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(LabResultsService);
    await service.history('t1', 'p1');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1' }) }));
  });
});

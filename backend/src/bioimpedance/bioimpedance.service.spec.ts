import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { BioimpedanceService } from './bioimpedance.service';

describe('BioimpedanceService', () => {
  it('deve listar evolução por tenant e paciente', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prismaMock = { bioimpedanceExam: { findMany } } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [BioimpedanceService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    const service = moduleRef.get(BioimpedanceService);
    await service.evolution('t1', 'p1');

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: 't1', patientId: 'p1' } }));
  });
});

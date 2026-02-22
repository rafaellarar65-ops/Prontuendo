import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  it('deve aplicar tenantId ao listar pacientes', async () => {
    const prismaMock = {
      patient: { findMany: jest.fn().mockResolvedValue([]) },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(PatientsService);
    await service.findAll('tenant-x', { page: 1, perPage: 10, q: 'ana' });

    expect(prismaMock.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-x' }),
      }),
    );
  });
});

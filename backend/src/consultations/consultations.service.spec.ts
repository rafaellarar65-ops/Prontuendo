import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ConsultationsService } from './consultations.service';

describe('ConsultationsService', () => {
  it('deve falhar autosave quando consulta não existe no tenant', async () => {
    const prismaMock = {
      consultation: { findFirst: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    const service = moduleRef.get(ConsultationsService);

    await expect(service.autosave('t1', 'u1', 'c1', { anamnese: { queixa: 'dor' } })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

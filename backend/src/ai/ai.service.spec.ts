import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { ClinicalContextService } from './clinical-context.service';

describe('AiService', () => {
  it('deve registrar trilha de auditoria ao acionar proxy', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prismaMock = { activityLog: { create } } as unknown as PrismaService;

    const moduleRef = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(null) } },
        { provide: ClinicalContextService, useValue: { getSummary: jest.fn() } },
      ],
    }).compile();

    const service = moduleRef.get(AiService);
    await service.proxy('assist-consultation', 't1', 'u1', { prompt: 'x' });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: 't1' }) }));
  });
});

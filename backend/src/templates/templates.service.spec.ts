import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  it('deve filtrar consultas por tenant', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: PrismaService,
          useValue: {
            documentTemplate: {
              findMany,
            },
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(TemplatesService);
    await service.findAll('t1');

    expect(findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});

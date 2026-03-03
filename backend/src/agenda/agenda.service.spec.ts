import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AgendaService } from './agenda.service';

describe('AgendaService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AgendaService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: async (callback: (trx: { activityLog: { create: jest.Mock } }) => Promise<void>) => {
              await callback({
                activityLog: {
                  create: jest.fn(),
                },
              });
            },
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(AgendaService);
    await service.create('t1', 'u1', { nome: 'x' });
    await service.create('t2', 'u2', { nome: 'y' });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });
});

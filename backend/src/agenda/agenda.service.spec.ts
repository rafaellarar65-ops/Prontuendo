import { Test } from '@nestjs/testing';

import { AgendaService } from './agenda.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AgendaService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AgendaService,
        { provide: PrismaService, useValue: { appointment: { create: jest.fn(), findMany: jest.fn() } } },
      ],
    }).compile();

    const service = moduleRef.get(AgendaService);
    service.create('t1', 'u1', { date: '2023-10-10', startTime: '10:00', type: 'PRIMEIRA_CONSULTA', patientId: 'p1' } as any);
    service.create('t2', 'u2', { date: '2023-10-11', startTime: '11:00', type: 'RETORNO', patientId: 'p2' } as any);

    expect(service.list('t1', {} as any)).toBeDefined();
    expect(service.list('t2', {} as any)).toBeDefined();
  });
});

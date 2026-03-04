import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AgendaService } from './agenda.service';

describe('AgendaService', () => {
  it('deve criar e listar por tenant', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'a1',
        tenantId: 't1',
        patientId: 'p1',
        clinicianId: 'u1',
        date: new Date('2026-01-01T00:00:00.000Z'),
        startTime: '10:00',
        type: 'RETORNO',
        status: 'AGENDADO',
        notes: null,
        patient: { fullName: 'Paciente 1' },
      },
    ]);

    const create = jest.fn().mockResolvedValue({
      id: 'a2',
      tenantId: 't1',
      patientId: 'p2',
      clinicianId: 'u1',
      date: new Date('2026-01-02T00:00:00.000Z'),
      startTime: '11:00',
      type: 'PRIMEIRA_CONSULTA',
      status: 'AGENDADO',
      notes: 'obs',
      patient: { fullName: 'Paciente 2' },
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        AgendaService,
        {
          provide: PrismaService,
          useValue: {
            appointment: {
              findMany,
              findFirst: jest.fn(),
              create,
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    const service = moduleRef.get(AgendaService);
    const created = await service.create('t1', 'u1', {
      patientId: 'p2',
      date: '2026-01-02',
      time: '11:00',
      type: 'PRIMEIRA_CONSULTA',
    });
    const list = await service.findAll('t1');

    expect(created.patientName).toBe('Paciente 2');
    expect(list).toHaveLength(1);
    expect(list[0].patientName).toBe('Paciente 1');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: { patient: { select: { fullName: true } } } }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ include: { patient: { select: { fullName: true } } } }),
    );
  });
});

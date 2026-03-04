import { Test } from '@nestjs/testing';

import { AgendaService } from './agenda.service';

describe('AgendaService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AgendaService],
    }).compile();

    const service = moduleRef.get(AgendaService);

    service.create('t1', 'u1', {
      patientId: 'p1',
      date: '2026-03-03',
      time: '09:00',
      type: 'RETORNO',
    });

    service.create('t2', 'u2', {
      patientId: 'p2',
      date: '2026-03-03',
      time: '10:00',
      type: 'EXAME',
    });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });

  it('deve filtrar por data e paciente', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AgendaService],
    }).compile();

    const service = moduleRef.get(AgendaService);

    service.create('t1', 'u1', {
      patientId: 'p1',
      date: '2026-03-03',
      time: '09:00',
      type: 'RETORNO',
    });

    service.create('t1', 'u1', {
      patientId: 'p2',
      date: '2026-03-04',
      time: '10:00',
      type: 'EXAME',
    });

    expect(service.findByDate('t1', '2026-03-03')).toHaveLength(1);
    expect(service.findByPatient('t1', 'p2')).toHaveLength(1);
  });
});

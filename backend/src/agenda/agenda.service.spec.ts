import { Test } from '@nestjs/testing';

import { AgendaService } from './agenda.service';

describe('AgendaService', () => {
  it('deve criar e listar por tenant e data', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AgendaService],
    }).compile();

    const service = moduleRef.get(AgendaService);
    service.create('t1', 'u1', {
      patientId: 'p1',
      clinicianId: 'c1',
      date: '2026-01-15',
      start: '09:00',
      end: '09:30',
      durationMin: 30,
    });
    service.create('t2', 'u2', {
      patientId: 'p2',
      clinicianId: 'c2',
      date: '2026-01-15',
      start: '10:00',
      end: '10:30',
      durationMin: 30,
    });

    expect(service.findByDate('t1', '2026-01-15')).toHaveLength(1);
    expect(service.findByDate('t2', '2026-01-15')).toHaveLength(1);
  });
});

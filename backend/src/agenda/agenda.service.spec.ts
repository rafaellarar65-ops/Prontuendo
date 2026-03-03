import { Test } from '@nestjs/testing';

import { AppointmentType } from './dto/create-appointment.dto';
import { AgendaService } from './agenda.service';

describe('AgendaService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AgendaService],
    }).compile();

    const service = moduleRef.get(AgendaService);
    service.create('t1', 'u1', {
      patientId: 'p1',
      clinicianId: 'c1',
      type: AppointmentType.FIRST_CONSULTATION,
      scheduledAt: new Date().toISOString(),
    });
    service.create('t2', 'u2', {
      patientId: 'p2',
      clinicianId: 'c2',
      type: AppointmentType.FOLLOW_UP,
      scheduledAt: new Date().toISOString(),
    });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });
});

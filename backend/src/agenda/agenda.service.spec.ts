import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';

import { AgendaService } from './agenda.service';

describe('AgendaService', () => {
  it('deve criar e listar por tenant', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [AgendaService],
    }).compile();

    const service = moduleRef.get(AgendaService);
    service.create('t1', 'u1', { nome: 'x' });
    service.create('t2', 'u2', { nome: 'y' });

    expect(service.list('t1')).toHaveLength(1);
    expect(service.list('t2')).toHaveLength(1);
  });

  it('deve bloquear criação em horário passado', async () => {
    const moduleRef = await Test.createTestingModule({ providers: [AgendaService] }).compile();
    const service = moduleRef.get(AgendaService);

    const past = new Date(Date.now() - 60_000);
    const date = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(
      past.getDate(),
    ).padStart(2, '0')}`;
    const startTime = `${String(past.getHours()).padStart(2, '0')}:${String(past.getMinutes()).padStart(2, '0')}`;

    expect(() =>
      service.create('t1', 'u1', {
        clinicianId: 'c1',
        date,
        startTime,
        status: 'AGENDADO',
      }),
    ).toThrow(BadRequestException);
  });

  it('deve bloquear conflito no mesmo profissional/data/horário ao criar', async () => {
    const moduleRef = await Test.createTestingModule({ providers: [AgendaService] }).compile();
    const service = moduleRef.get(AgendaService);

    const future = new Date(Date.now() + 86_400_000);
    const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(
      future.getDate(),
    ).padStart(2, '0')}`;

    service.create('t1', 'u1', {
      clinicianId: 'c1',
      date,
      startTime: '10:00',
      status: 'AGENDADO',
    });

    expect(() =>
      service.create('t1', 'u1', {
        clinicianId: 'c1',
        date,
        startTime: '10:00',
        status: 'CONFIRMADO',
      }),
    ).toThrow(ConflictException);
  });

  it('deve permitir cancelar sem remover registro (soft state)', async () => {
    const moduleRef = await Test.createTestingModule({ providers: [AgendaService] }).compile();
    const service = moduleRef.get(AgendaService);

    const future = new Date(Date.now() + 86_400_000);
    const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(
      future.getDate(),
    ).padStart(2, '0')}`;

    const created = service.create('t1', 'u1', {
      clinicianId: 'c1',
      date,
      startTime: '11:00',
      status: 'AGENDADO',
    });

    const canceled = service.update('t1', created.id, { status: 'CANCELADO' });

    expect(canceled).toBeTruthy();
    expect(canceled?.payload.status).toBe('CANCELADO');
    expect(service.list('t1')).toHaveLength(1);
  });

  it('deve ignorar o próprio id ao verificar conflito em update', async () => {
    const moduleRef = await Test.createTestingModule({ providers: [AgendaService] }).compile();
    const service = moduleRef.get(AgendaService);

    const future = new Date(Date.now() + 86_400_000);
    const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(
      future.getDate(),
    ).padStart(2, '0')}`;

    const created = service.create('t1', 'u1', {
      clinicianId: 'c1',
      date,
      startTime: '12:00',
      status: 'AGENDADO',
    });

    expect(() => service.update('t1', created.id, { status: 'CONFIRMADO' })).not.toThrow();
  });
});

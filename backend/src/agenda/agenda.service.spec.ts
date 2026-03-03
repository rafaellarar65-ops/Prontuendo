import { Test } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { AgendaService } from './agenda.service';

describe('AgendaService', () => {
  const prismaMock = {
    appointment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  };

  let service: AgendaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AgendaService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = moduleRef.get(AgendaService);
  });

  it('create deve criar Appointment e registrar ActivityLog', async () => {
    prismaMock.appointment.create.mockResolvedValue({ id: 'appt-1', tenantId: 't1' });

    const result = await service.create('t1', { patientId: 'p1', actorId: 'u1' });

    expect(result).toEqual({ id: 'appt-1', tenantId: 't1' });
    expect(prismaMock.appointment.create).toHaveBeenCalledWith({
      data: { patientId: 'p1', actorId: 'u1', tenantId: 't1' },
    });
    expect(prismaMock.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 't1',
        actorId: 'u1',
        action: 'APPOINTMENT_CREATED',
        resource: 'APPOINTMENT',
        metadata: { appointmentId: 'appt-1' },
      }),
    });
  });

  it('findByDate deve consultar por range UTC e incluir paciente/clinico', async () => {
    prismaMock.appointment.findMany.mockResolvedValue([]);

    await service.findByDate('t1', '2025-01-15T12:00:00.000Z');

    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 't1',
        startsAt: {
          gte: new Date('2025-01-15T00:00:00.000Z'),
          lte: new Date('2025-01-15T23:59:59.999Z'),
        },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        patient: { select: { fullName: true } },
        clinician: { select: { fullName: true } },
      },
    });
  });

  it('findByPatient deve limitar 50 e ordenar DESC', async () => {
    prismaMock.appointment.findMany.mockResolvedValue([]);

    await service.findByPatient('t1', 'p1');

    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
      where: { tenantId: 't1', patientId: 'p1' },
      orderBy: { startsAt: 'desc' },
      take: 50,
    });
  });

  it('findByRange deve incluir paciente e clinico por tenant', async () => {
    prismaMock.appointment.findMany.mockResolvedValue([]);

    await service.findByRange('t1', '2025-01-01T00:00:00.000Z', '2025-01-31T23:59:59.999Z');

    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 't1',
        startsAt: {
          gte: new Date('2025-01-01T00:00:00.000Z'),
          lte: new Date('2025-01-31T23:59:59.999Z'),
        },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        patient: true,
        clinician: true,
      },
    });
  });

  it('update deve atualizar e registrar mudança de status', async () => {
    prismaMock.appointment.findFirst.mockResolvedValue({ id: 'appt-1', status: 'AGENDADO' });
    prismaMock.appointment.update.mockResolvedValue({ id: 'appt-1', status: 'CONFIRMADO' });

    const result = await service.update('t1', 'appt-1', { status: 'CONFIRMADO', actorId: 'u2' });

    expect(result).toEqual({ id: 'appt-1', status: 'CONFIRMADO' });
    expect(prismaMock.appointment.findFirst).toHaveBeenCalledWith({
      where: { tenantId: 't1', id: 'appt-1' },
      select: { id: true, status: true },
    });
    expect(prismaMock.appointment.update).toHaveBeenCalledWith({
      where: { id: 'appt-1' },
      data: { status: 'CONFIRMADO', actorId: 'u2' },
    });
    expect(prismaMock.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 't1',
        actorId: 'u2',
        action: 'APPOINTMENT_UPDATED',
        resource: 'APPOINTMENT',
        metadata: {
          appointmentId: 'appt-1',
          previousStatus: 'AGENDADO',
          newStatus: 'CONFIRMADO',
        },
      }),
    });
  });

  it('update deve retornar null quando appointment não existe no tenant', async () => {
    prismaMock.appointment.findFirst.mockResolvedValue(null);

    const result = await service.update('t1', 'appt-404', { status: 'CONFIRMADO' });

    expect(result).toBeNull();
    expect(prismaMock.appointment.update).not.toHaveBeenCalled();
    expect(prismaMock.activityLog.create).not.toHaveBeenCalled();
  });

  it('remove deve cancelar (soft delete) por tenant', async () => {
    prismaMock.appointment.update.mockResolvedValue({ id: 'appt-1', status: 'CANCELADO' });

    await service.remove('t1', 'appt-1');

    expect(prismaMock.appointment.update).toHaveBeenCalledWith({
      where: { id: 'appt-1' },
      data: { status: 'CANCELADO', tenantId: 't1' },
    });
  });

  it('findAvailableSlots deve retornar horários sem colisão', async () => {
    prismaMock.appointment.findMany.mockResolvedValue([
      { startsAt: '2025-01-10T09:00:00.000Z', endsAt: '2025-01-10T09:30:00.000Z' },
      { startsAt: '2025-01-10T10:00:00.000Z', endsAt: '2025-01-10T11:00:00.000Z' },
    ]);

    const slots = await service.findAvailableSlots('t1', 'c1', '2025-01-10T00:00:00.000Z', 30);

    expect(prismaMock.appointment.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 't1',
        clinicianId: 'c1',
        startsAt: {
          gte: new Date('2025-01-10T08:00:00.000Z'),
          lt: new Date('2025-01-10T18:00:00.000Z'),
        },
        status: { not: 'CANCELADO' },
      },
      orderBy: { startsAt: 'asc' },
      select: { startsAt: true, endsAt: true },
    });
    expect(slots).toContainEqual({
      startsAt: new Date('2025-01-10T08:00:00.000Z'),
      endsAt: new Date('2025-01-10T08:30:00.000Z'),
    });
    expect(slots).not.toContainEqual({
      startsAt: new Date('2025-01-10T09:00:00.000Z'),
      endsAt: new Date('2025-01-10T09:30:00.000Z'),
    });
    expect(slots).not.toContainEqual({
      startsAt: new Date('2025-01-10T10:30:00.000Z'),
      endsAt: new Date('2025-01-10T11:00:00.000Z'),
    });
  });
});

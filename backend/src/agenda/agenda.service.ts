import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type AppointmentType = 'PRIMEIRA_CONSULTA' | 'RETORNO' | 'TELECONSULTA' | 'EXAME';
type AppointmentStatus = 'AGENDADO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

type AppointmentWithPatient = {
  id: string;
  tenantId: string;
  patientId: string;
  clinicianId: string;
  date: Date;
  startTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
  patient: {
    fullName: string;
  };
};

type AppointmentDelegate = {
  findMany(args: Record<string, unknown>): Promise<AppointmentWithPatient[]>;
  findFirst(args: Record<string, unknown>): Promise<AppointmentWithPatient | null>;
  create(args: Record<string, unknown>): Promise<AppointmentWithPatient>;
  update(args: Record<string, unknown>): Promise<AppointmentWithPatient>;
  delete(args: Record<string, unknown>): Promise<AppointmentWithPatient>;
};

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  private get appointment(): AppointmentDelegate {
    return (this.prisma as unknown as { appointment: AppointmentDelegate }).appointment;
  }

  private readonly patientInclude = {
    patient: {
      select: {
        fullName: true,
      },
    },
  };

  private mapAppointment(appointment: AppointmentWithPatient) {
    return {
      id: appointment.id,
      patientId: appointment.patientId,
      patientName: appointment.patient.fullName,
      date: appointment.date.toISOString(),
      time: appointment.startTime,
      type: appointment.type,
      status: appointment.status,
      notes: appointment.notes ?? undefined,
    };
  }

  async findAll(tenantId: string) {
    const appointments = await this.appointment.findMany({
      where: { tenantId },
      include: this.patientInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return appointments.map((appointment) => this.mapAppointment(appointment));
  }

  async findByDate(tenantId: string, date: string) {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const appointments = await this.appointment.findMany({
      where: {
        tenantId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: this.patientInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return appointments.map((appointment) => this.mapAppointment(appointment));
  }

  async findByPatient(tenantId: string, patientId: string) {
    const appointments = await this.appointment.findMany({
      where: { tenantId, patientId },
      include: this.patientInclude,
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    });

    return appointments.map((appointment) => this.mapAppointment(appointment));
  }

  async create(tenantId: string, clinicianId: string, payload: Record<string, unknown>) {
    const created = await this.appointment.create({
      data: {
        tenantId,
        clinicianId,
        patientId: payload.patientId,
        date: new Date(String(payload.date)),
        startTime: String(payload.time),
        endTime: payload.endTime ? String(payload.endTime) : null,
        type: payload.type,
        status: (payload.status as AppointmentStatus | undefined) ?? 'AGENDADO',
        notes: payload.notes ? String(payload.notes) : null,
        serviceId: payload.serviceId ? String(payload.serviceId) : null,
        roomId: payload.roomId ? String(payload.roomId) : null,
      },
      include: this.patientInclude,
    });

    return this.mapAppointment(created);
  }

  async update(tenantId: string, id: string, payload: Record<string, unknown>) {
    const current = await this.appointment.findFirst({
      where: { id, tenantId },
      include: this.patientInclude,
    });

    if (!current) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const updated = await this.appointment.update({
      where: { id },
      data: {
        patientId: payload.patientId,
        date: payload.date ? new Date(String(payload.date)) : undefined,
        startTime: payload.time ? String(payload.time) : undefined,
        endTime: payload.endTime ? String(payload.endTime) : undefined,
        type: payload.type,
        status: payload.status,
        notes: payload.notes === undefined ? undefined : payload.notes ? String(payload.notes) : null,
        serviceId: payload.serviceId === undefined ? undefined : payload.serviceId ? String(payload.serviceId) : null,
        roomId: payload.roomId === undefined ? undefined : payload.roomId ? String(payload.roomId) : null,
      },
      include: this.patientInclude,
    });

    return this.mapAppointment(updated);
  }

  async updateStatus(tenantId: string, id: string, status: AppointmentStatus) {
    const current = await this.appointment.findFirst({
      where: { id, tenantId },
      include: this.patientInclude,
    });

    if (!current) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    const updated = await this.appointment.update({
      where: { id },
      data: { status },
      include: this.patientInclude,
    });

    return this.mapAppointment(updated);
  }

  async remove(tenantId: string, id: string) {
    const current = await this.appointment.findFirst({
      where: { id, tenantId },
      include: this.patientInclude,
    });

    if (!current) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    await this.appointment.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async list(tenantId: string) {
    return this.findAll(tenantId);
  }
}

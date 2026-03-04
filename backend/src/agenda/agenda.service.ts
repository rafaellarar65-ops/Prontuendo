import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { AppointmentStatus } from './dto/appointment.types';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

type AppointmentRecord = {
  id: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  patientId: string;
  patientName?: string;
  date: string;
  time: string;
  type: CreateAppointmentDto['type'];
  status: AppointmentStatus;
  notes?: string;
};

@Injectable()
export class AgendaService {
  private readonly store: AppointmentRecord[] = [];

  list(tenantId: string, query: ListAppointmentsDto = {}) {
    return this.store.filter((item) => {
      if (item.tenantId !== tenantId) return false;
      if (query.date && item.date !== query.date) return false;
      if (query.patientId && item.patientId !== query.patientId) return false;
      return true;
    });
  }

  findByDate(tenantId: string, date: string) {
    return this.list(tenantId, { date });
  }

  findByPatient(tenantId: string, patientId: string) {
    return this.list(tenantId, { patientId });
  }

  create(tenantId: string, clinicianId: string, dto: CreateAppointmentDto) {
    const now = new Date().toISOString();
    const item: AppointmentRecord = {
      id: randomUUID(),
      tenantId,
      createdBy: clinicianId,
      createdAt: now,
      updatedAt: now,
      patientId: dto.patientId,
      patientName: dto.patientName,
      date: dto.date,
      time: dto.time,
      type: dto.type,
      status: 'AGENDADO',
      notes: dto.notes,
    };

    this.store.push(item);
    return item;
  }

  update(tenantId: string, id: string, dto: UpdateAppointmentDto) {
    const item = this.store.find((entry) => entry.tenantId === tenantId && entry.id === id);
    if (!item) {
      return null;
    }

    Object.assign(item, dto);
    item.updatedAt = new Date().toISOString();
    return item;
  }

  updateStatus(tenantId: string, id: string, status: AppointmentStatus) {
    return this.update(tenantId, id, { status });
  }

  remove(tenantId: string, id: string) {
    const index = this.store.findIndex((entry) => entry.tenantId === tenantId && entry.id === id);
    if (index < 0) {
      return { deleted: false };
    }

    this.store.splice(index, 1);
    return { deleted: true };
  }
}

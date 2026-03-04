import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from './dto/appointment.enums';

type Item = {
  id: string;
  tenantId: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime?: string;
  type: CreateAppointmentDto['type'];
  notes?: string;
  serviceId?: string;
  roomId?: string;
  status: AppointmentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class AgendaService {
  private readonly store: Item[] = [];

  list(tenantId: string, query: ListAppointmentsDto) {
    return this.store.filter((item) => {
      if (item.tenantId !== tenantId) return false;
      if (query.date && item.date !== query.date) return false;
      if (query.status && item.status !== query.status) return false;
      if (query.patientId && item.patientId !== query.patientId) return false;
      return true;
    });
  }

  create(tenantId: string, actorId: string, dto: CreateAppointmentDto) {
    const now = new Date().toISOString();
    const item: Item = {
      id: randomUUID(),
      tenantId,
      patientId: dto.patientId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      type: dto.type,
      notes: dto.notes,
      serviceId: dto.serviceId,
      roomId: dto.roomId,
      status: AppointmentStatus.SCHEDULED,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
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

  remove(tenantId: string, id: string) {
    const index = this.store.findIndex((entry) => entry.tenantId === tenantId && entry.id === id);
    if (index < 0) {
      return { deleted: false };
    }

    this.store.splice(index, 1);
    return { deleted: true };
  }

  execute(action: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    return { action, tenantId, actorId, status: 'queued', payload };
  }
}

import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

type AgendaItem = {
  id: string;
  tenantId: string;
  patientId: string;
  clinicianId: string;
  date: string;
  start: string;
  end: string;
  durationMin: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class AgendaService {
  private readonly store: AgendaItem[] = [];

  findByDate(tenantId: string, date: string) {
    return this.store.filter((item) => item.tenantId === tenantId && item.date === date);
  }

  findByPatient(tenantId: string, patientId: string) {
    return this.store.filter((item) => item.tenantId === tenantId && item.patientId === patientId);
  }

  findByRange(tenantId: string, start: string, end: string) {
    return this.store.filter((item) => item.tenantId === tenantId && item.date >= start && item.date <= end);
  }

  findAvailableSlots(tenantId: string, clinicianId: string, date: string, durationMin: number) {
    const appointments = this.store
      .filter((item) => item.tenantId === tenantId && item.clinicianId === clinicianId && item.date === date)
      .sort((a, b) => a.start.localeCompare(b.start));

    return {
      clinicianId,
      date,
      durationMin,
      appointments,
      availableSlots: [],
    };
  }

  create(tenantId: string, actorId: string, dto: CreateAgendaDto) {
    const now = new Date().toISOString();
    const item: AgendaItem = { id: randomUUID(), tenantId, createdBy: actorId, createdAt: now, updatedAt: now, ...dto };
    this.store.push(item);
    return item;
  }

  update(tenantId: string, id: string, dto: UpdateAgendaDto) {
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
}

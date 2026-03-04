import { randomUUID } from 'crypto';

import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';

type Item = { id: string; tenantId: string; payload: Record<string, unknown>; createdBy: string; createdAt: string; updatedAt: string };

@Injectable()
export class AgendaService {
  private readonly store: Item[] = [];

  private parseDateTime(date: string, startTime: string) {
    const [year, month, day] = date.split('-').map((value) => Number(value));
    const [hours, minutes] = startTime.split(':').map((value) => Number(value));

    if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
      throw new BadRequestException('Data ou horário inválido para agendamento.');
    }

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }

  private getSchedulingFields(payload: Record<string, unknown>) {
    return {
      clinicianId: typeof payload.clinicianId === 'string' ? payload.clinicianId : null,
      date: typeof payload.date === 'string' ? payload.date : null,
      startTime: typeof payload.startTime === 'string' ? payload.startTime : null,
      status: typeof payload.status === 'string' ? payload.status : null,
    };
  }

  private validateNotPast(date: string, startTime: string) {
    const slotDateTime = this.parseDateTime(date, startTime);
    if (slotDateTime.getTime() < Date.now()) {
      throw new BadRequestException('Não é permitido agendar ou reagendar para um horário passado.');
    }
  }

  private findAppointmentConflict(params: {
    tenantId: string;
    clinicianId: string;
    date: string;
    startTime: string;
    excludedId?: string;
  }) {
    const { tenantId, clinicianId, date, startTime, excludedId } = params;

    return this.store.find((item) => {
      if (item.tenantId !== tenantId || item.id === excludedId) {
        return false;
      }

      const entry = this.getSchedulingFields(item.payload);
      return (
        entry.clinicianId === clinicianId
        && entry.date === date
        && entry.startTime === startTime
        && entry.status !== 'CANCELADO'
      );
    });
  }

  private validateSchedulingRules(tenantId: string, payload: Record<string, unknown>, excludedId?: string) {
    const { clinicianId, date, startTime } = this.getSchedulingFields(payload);

    if (!clinicianId || !date || !startTime) {
      return;
    }

    this.validateNotPast(date, startTime);

    const conflict = this.findAppointmentConflict({
      tenantId,
      clinicianId,
      date,
      startTime,
      excludedId,
    });

    if (conflict) {
      throw new ConflictException('Já existe agendamento para este profissional na mesma data e horário.');
    }
  }

  list(tenantId: string) {
    return this.store.filter((item) => item.tenantId === tenantId);
  }

  create(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    this.validateSchedulingRules(tenantId, payload);

    const now = new Date().toISOString();
    const item: Item = { id: randomUUID(), tenantId, payload, createdBy: actorId, createdAt: now, updatedAt: now };
    this.store.push(item);
    return item;
  }

  update(tenantId: string, id: string, payload: Record<string, unknown>) {
    const item = this.store.find((entry) => entry.tenantId === tenantId && entry.id === id);
    if (!item) {
      return null;
    }

    const nextPayload = { ...item.payload, ...payload };
    const current = this.getSchedulingFields(item.payload);
    const next = this.getSchedulingFields(nextPayload);
    const isCancelOnly = next.status === 'CANCELADO'
      && current.clinicianId === next.clinicianId
      && current.date === next.date
      && current.startTime === next.startTime;

    if (!isCancelOnly) {
      this.validateSchedulingRules(tenantId, nextPayload, id);
    }

    item.payload = nextPayload;
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

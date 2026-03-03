import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type AppointmentStatus = 'AGENDADO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

type Item = {
  id: string;
  tenantId: string;
  payload: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class AgendaService {
  private readonly store: Item[] = [];

  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.store.filter((item) => item.tenantId === tenantId);
  }

  async create(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();
    const status = this.extractStatus(payload);
    const item: Item = { id: randomUUID(), tenantId, payload: { ...payload, status }, createdBy: actorId, createdAt: now, updatedAt: now };

    await this.prisma.$transaction(async (trx) => {
      this.store.push(item);
      await trx.activityLog.create({
        data: {
          tenantId,
          actorId,
          action: 'CREATE',
          resource: 'agenda',
          metadata: {
            appointmentId: item.id,
            patientId: item.payload.patientId ?? null,
            status,
          },
        },
      });
    });

    return item;
  }

  update(tenantId: string, id: string, payload: Record<string, unknown>) {
    const item = this.store.find((entry) => entry.tenantId === tenantId && entry.id === id);
    if (!item) {
      return null;
    }

    item.payload = { ...item.payload, ...payload };
    item.updatedAt = new Date().toISOString();
    return item;
  }

  async updateStatus(tenantId: string, actorId: string, id: string, nextStatus: AppointmentStatus) {
    const item = this.store.find((entry) => entry.tenantId === tenantId && entry.id === id);
    if (!item) {
      return null;
    }

    const previousStatus = this.extractStatus(item.payload);
    item.payload = { ...item.payload, status: nextStatus };
    item.updatedAt = new Date().toISOString();

    const statusAction = this.getStatusAction(nextStatus, previousStatus);

    await this.prisma.$transaction(async (trx) => {
      await trx.activityLog.create({
        data: {
          tenantId,
          actorId,
          action: statusAction,
          resource: 'agenda',
          metadata: {
            appointmentId: item.id,
            patientId: item.payload.patientId ?? null,
            from: previousStatus,
            to: nextStatus,
          },
        },
      });

      if (nextStatus === 'CANCELADO') {
        await trx.activityLog.create({
          data: {
            tenantId,
            actorId,
            action: 'CANCEL_AUDIT',
            resource: 'agenda',
            metadata: {
              appointmentId: item.id,
              patientId: item.payload.patientId ?? null,
              from: previousStatus,
              to: nextStatus,
              auditScope: 'CLINICAL_OPERATIONAL',
            },
          },
        });
      }
    });

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

  private extractStatus(payload: Record<string, unknown>): AppointmentStatus {
    const status = payload.status;
    if (status === 'CONFIRMADO' || status === 'EM_ANDAMENTO' || status === 'CONCLUIDO' || status === 'CANCELADO') {
      return status;
    }

    return 'AGENDADO';
  }

  private getStatusAction(nextStatus: AppointmentStatus, previousStatus: AppointmentStatus) {
    if (nextStatus === 'CONFIRMADO') {
      return 'CONFIRM';
    }

    if (nextStatus === 'EM_ANDAMENTO') {
      return 'START';
    }

    if (nextStatus === 'CONCLUIDO') {
      return 'COMPLETE';
    }

    if (nextStatus === 'CANCELADO') {
      return 'CANCEL';
    }

    if (nextStatus !== previousStatus) {
      return 'STATUS_CHANGE';
    }

    return 'STATUS_CHANGE';
  }
}

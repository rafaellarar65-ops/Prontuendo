import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

type Item = { id: string; tenantId: string; payload: Record<string, unknown>; createdBy: string; createdAt: string; updatedAt: string };

@Injectable()
export class PrescriptionsService {
  private readonly store: Item[] = [];

  list(tenantId: string) {
    return this.store.filter((item) => item.tenantId === tenantId);
  }

  create(tenantId: string, actorId: string, payload: Record<string, unknown>) {
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

    item.payload = { ...item.payload, ...payload };
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


  createPrescription(tenantId: string, actorId: string, payload: object) {
    return this.create(tenantId, actorId, payload as Record<string, unknown>);
  }

  listByPatient(tenantId: string, patientId?: string) {
    if (!patientId) {
      return this.list(tenantId);
    }

    return this.list(tenantId).filter((item) => item.payload.patientId === patientId);
  }

  listByConsultation(tenantId: string, consultationId: string) {
    return this.list(tenantId).filter((item) => item.payload.consultationId === consultationId);
  }

  listActiveByPatient(tenantId: string, patientId?: string) {
    const now = new Date().toISOString();
    return this.listByPatient(tenantId, patientId).filter((item) => {
      const cancelledAt = item.payload.cancelledAt;
      if (typeof cancelledAt === 'string' && cancelledAt) {
        return false;
      }

      const validUntil = item.payload.validUntil;
      return typeof validUntil !== 'string' || validUntil >= now;
    });
  }

  cancel(tenantId: string, actorId: string, id: string) {
    return this.update(tenantId, id, { cancelledAt: new Date().toISOString(), cancelledBy: actorId });
  }

  renew(tenantId: string, actorId: string, id: string, validUntil?: string) {
    return this.update(tenantId, id, { renewedAt: new Date().toISOString(), renewedBy: actorId, validUntil });
  }

  execute(action: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    return { action, tenantId, actorId, status: 'queued', payload };
  }
}

import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

type Item = { id: string; tenantId: string; payload: Record<string, unknown>; createdBy: string; createdAt: string; updatedAt: string };

@Injectable()
export class DigitalSignatureService {
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

  execute(action: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    return { action, tenantId, actorId, status: 'queued', payload };
  }
}

import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { CreateProtocolDto } from './dto/create-protocol.dto';
import { ListProtocolsDto } from './dto/list-protocols.dto';
import { UpdateProtocolDto } from './dto/update-protocol.dto';

type Item = CreateProtocolDto & {
  id: string;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class ProtocolsService {
  private readonly store: Item[] = [];

  list(tenantId: string, query: ListProtocolsDto) {
    const filtered = this.store.filter((item) => {
      if (item.tenantId !== tenantId) {
        return false;
      }

      if (query.condition && item.targetCondition !== query.condition) {
        return false;
      }

      if (query.status && item.status !== query.status) {
        return false;
      }

      return true;
    });

    const start = (query.page - 1) * query.perPage;
    const end = start + query.perPage;
    return filtered.slice(start, end);
  }

  create(tenantId: string, actorId: string, dto: CreateProtocolDto) {
    const now = new Date().toISOString();
    const item: Item = { id: randomUUID(), tenantId, ...dto, createdBy: actorId, createdAt: now, updatedAt: now };
    this.store.push(item);
    return item;
  }

  update(tenantId: string, id: string, dto: UpdateProtocolDto) {
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

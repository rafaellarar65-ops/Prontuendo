import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { CreateProtocolDto } from './dto/create-protocol.dto';
import { ListProtocolsDto } from './dto/list-protocols.dto';
import { ProtocolStatus } from './dto/protocol-status.enum';
import { UpdateProtocolDto } from './dto/update-protocol.dto';

type Item = {
  id: string;
  tenantId: string;
  name: string;
  condition: string;
  content: Record<string, unknown>;
  status: ProtocolStatus;
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

      if (query.condition && item.condition !== query.condition) {
        return false;
      }

      if (query.status && item.status !== query.status) {
        return false;
      }

      return true;
    });

    const start = (query.page - 1) * query.perPage;
    const end = start + query.perPage;

    return {
      data: filtered.slice(start, end),
      page: query.page,
      perPage: query.perPage,
      total: filtered.length,
    };
  }

  findById(tenantId: string, id: string) {
    return this.store.find((item) => item.tenantId === tenantId && item.id === id) ?? null;
  }

  create(tenantId: string, actorId: string, dto: CreateProtocolDto) {
    const now = new Date().toISOString();
    const item: Item = {
      id: randomUUID(),
      tenantId,
      name: dto.name,
      condition: dto.condition,
      content: dto.content ?? {},
      status: dto.status ?? ProtocolStatus.ACTIVE,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
    };

    this.store.push(item);
    return item;
  }

  update(tenantId: string, id: string, dto: UpdateProtocolDto) {
    const item = this.findById(tenantId, id);
    if (!item) {
      return null;
    }

    if (dto.name !== undefined) {
      item.name = dto.name;
    }

    if (dto.condition !== undefined) {
      item.condition = dto.condition;
    }

    if (dto.content !== undefined) {
      item.content = { ...item.content, ...dto.content };
    }

    if (dto.status !== undefined) {
      item.status = dto.status;
    }

    item.updatedAt = new Date().toISOString();
    return item;
  }

  activate(tenantId: string, id: string) {
    return this.update(tenantId, id, { status: ProtocolStatus.ACTIVE });
  }

  deactivate(tenantId: string, id: string) {
    return this.update(tenantId, id, { status: ProtocolStatus.INACTIVE });
  }

  suggestions(tenantId: string, diagnosis: string) {
    return this.store
      .filter((item) => item.tenantId === tenantId && item.status === ProtocolStatus.ACTIVE && item.condition === diagnosis)
      .map(({ id, name, condition, status }) => ({ id, name, condition, status }));
  }
}

import { randomUUID } from 'crypto';

import { Injectable } from '@nestjs/common';

import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

export type TemplateItem = {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  canvasJson: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class TemplatesService {
  private readonly store: TemplateItem[] = [];

  list(tenantId: string) {
    return this.store.filter((item) => item.tenantId === tenantId);
  }

  findOne(tenantId: string, id: string) {
    return this.store.find((entry) => entry.tenantId === tenantId && entry.id === id) ?? null;
  }

  create(tenantId: string, actorId: string, dto: CreateTemplateDto) {
    const now = new Date().toISOString();
    const item: TemplateItem = {
      id: randomUUID(),
      tenantId,
      name: dto.name,
      description: dto.description,
      canvasJson: dto.canvasJson,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
    };
    this.store.push(item);
    return item;
  }

  update(tenantId: string, id: string, dto: UpdateTemplateDto) {
    const item = this.findOne(tenantId, id);
    if (!item) {
      return null;
    }

    if (dto.name !== undefined) {
      item.name = dto.name;
    }
    if (dto.description !== undefined) {
      item.description = dto.description;
    }
    if (dto.canvasJson !== undefined) {
      item.canvasJson = dto.canvasJson;
    }

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

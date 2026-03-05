import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private get documentTemplate() {
    return (this.prisma as any).documentTemplate;
  }

  async findAll(tenantId: string) {
    return this.documentTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    return this.documentTemplate.findFirst({
      where: { id, tenantId },
    });
  }

  async create(tenantId: string, actorId: string, dto: CreateTemplateDto) {
    return this.documentTemplate.create({
      data: {
        tenantId,
        createdBy: actorId,
        ...dto,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateTemplateDto) {
    const updated = await this.documentTemplate.updateMany({
      where: { id, tenantId },
      data: dto,
    });

    if (updated.count === 0) {
      return null;
    }

    return this.findById(tenantId, id);
  }

  async delete(tenantId: string, id: string) {
    const deleted = await this.documentTemplate.deleteMany({
      where: { id, tenantId },
    });

    return { deleted: deleted.count > 0 };
  }

  async findByCategory(tenantId: string, category: string) {
    return this.documentTemplate.findMany({
      where: { tenantId, category },
      orderBy: { createdAt: 'desc' },
    });
  }

  async duplicate(tenantId: string, id: string, actorId: string) {
    const source = await this.findById(tenantId, id);
    if (!source) {
      return null;
    }

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...templateData } = source;

    return this.documentTemplate.create({
      data: {
        ...templateData,
        tenantId,
        createdBy: actorId,
        name: `${source.name} (cópia)`,
        canvasJson: source.canvasJson,
      },
    });
  }

  execute(action: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    return { action, tenantId, actorId, status: 'queued', payload };
  }
}

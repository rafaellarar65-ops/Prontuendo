import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type ProtocolStatus = 'ACTIVE' | 'INACTIVE';

type ProtocolJsonPayload = Record<string, unknown>;

type ProtocolCreateDto = {
  name?: string;
  title?: string;
  targetCondition?: string;
  status?: ProtocolStatus;
  steps?: unknown;
  medications?: unknown;
  inclusionCriteria?: unknown;
  [key: string]: unknown;
};

type ProtocolUpdateDto = ProtocolCreateDto;

type ProtocolFilters = {
  targetCondition?: string;
  status?: ProtocolStatus;
};

@Injectable()
export class ProtocolsService {
  constructor(private readonly prisma: PrismaService) {}

  private get protocolDelegate() {
    return (this.prisma as unknown as { protocol: any }).protocol;
  }

  private ensureJsonObject(value: unknown, field: string): ProtocolJsonPayload {
    if (value === undefined || value === null) {
      return {};
    }

    if (typeof value === 'string') {
      const parsed = JSON.parse(value) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new TypeError(`${field} must be a JSON object`);
      }

      return parsed as ProtocolJsonPayload;
    }

    if (Array.isArray(value) || typeof value !== 'object') {
      throw new TypeError(`${field} must be a JSON object`);
    }

    return value as ProtocolJsonPayload;
  }

  private ensureJsonArray(value: unknown, field: string): unknown[] {
    if (value === undefined || value === null) {
      return [];
    }

    if (typeof value === 'string') {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) {
        throw new TypeError(`${field} must be a JSON array`);
      }

      return parsed;
    }

    if (!Array.isArray(value)) {
      throw new TypeError(`${field} must be a JSON array`);
    }

    return value;
  }

  private normalizePayload<T extends ProtocolCreateDto | ProtocolUpdateDto>(dto: T) {
    return {
      ...dto,
      steps: this.ensureJsonArray(dto.steps, 'steps'),
      medications: this.ensureJsonArray(dto.medications, 'medications'),
      inclusionCriteria: this.ensureJsonObject(dto.inclusionCriteria, 'inclusionCriteria'),
    };
  }

  list(tenantId: string) {
    return this.findAll(tenantId, {});
  }

  async create(tenantId: string, actorId: string, dto: ProtocolCreateDto) {
    const payload = this.normalizePayload(dto);

    return this.protocolDelegate.create({
      data: {
        ...payload,
        tenantId,
        createdBy: actorId,
        updatedBy: actorId,
        status: payload.status ?? 'INACTIVE',
      },
    });
  }

  async findAll(tenantId: string, filters: ProtocolFilters = {}) {
    return this.protocolDelegate.findMany({
      where: {
        tenantId,
        ...(filters.targetCondition ? { targetCondition: filters.targetCondition } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, id: string) {
    const protocol = await this.protocolDelegate.findFirst({
      where: { tenantId, id },
    });

    if (!protocol) {
      throw new NotFoundException(`Protocol ${id} not found for tenant ${tenantId}`);
    }

    return protocol;
  }

  async update(tenantId: string, id: string, actorId: string, dto: ProtocolUpdateDto) {
    await this.findById(tenantId, id);
    const payload = this.normalizePayload(dto);

    await this.protocolDelegate.updateMany({
      where: { tenantId, id },
      data: {
        ...payload,
        updatedBy: actorId,
      },
    });

    return this.findById(tenantId, id);
  }

  async activate(tenantId: string, id: string, actorId: string) {
    await this.findById(tenantId, id);

    await this.protocolDelegate.updateMany({
      where: { tenantId, id },
      data: {
        status: 'ACTIVE',
        updatedBy: actorId,
      },
    });

    return this.findById(tenantId, id);
  }

  async deactivate(tenantId: string, id: string, actorId: string) {
    await this.findById(tenantId, id);

    await this.protocolDelegate.updateMany({
      where: { tenantId, id },
      data: {
        status: 'INACTIVE',
        updatedBy: actorId,
      },
    });

    return this.findById(tenantId, id);
  }

  async suggestForDiagnosis(tenantId: string, diagnosisCodes: string[]) {
    const normalizedCodes = diagnosisCodes.map((code) => code.trim()).filter(Boolean);

    return this.protocolDelegate.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        targetCondition: {
          in: normalizedCodes,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    await this.protocolDelegate.deleteMany({ where: { tenantId, id } });

    return { deleted: true };
  }

  execute(action: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    return { action, tenantId, actorId, status: 'queued', payload };
  }
}

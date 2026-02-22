import { createHash } from 'crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsultationStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ListConsultationsDto } from './dto/list-consultations.dto';
import { UpsertConsultationSectionDto } from './dto/upsert-consultation-section.dto';

@Injectable()
export class ConsultationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, clinicianId: string, dto: CreateConsultationDto) {
    const consultation = await this.prisma.consultation.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        clinicianId,
        status: ConsultationStatus.DRAFT,
        latestDraft: Prisma.JsonNull,
      },
    });

    await this.prisma.consultationVersion.create({
      data: {
        consultationId: consultation.id,
        version: 1,
        isFinal: false,
        content: {},
      },
    });

    return consultation;
  }

  findAll(tenantId: string, query: ListConsultationsDto) {
    const where: Prisma.ConsultationWhereInput = {
      tenantId,
      patientId: query.patientId,
      status: query.status,
    };

    return this.prisma.consultation.findMany({
      where,
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async autosave(tenantId: string, clinicianId: string, id: string, dto: UpsertConsultationSectionDto) {
    const consultation = await this.prisma.consultation.findFirst({ where: { id, tenantId } });
    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    const lastVersion = await this.prisma.consultationVersion.findFirst({
      where: { consultationId: id },
      orderBy: { version: 'desc' },
    });

    const existing = (consultation.latestDraft ?? {}) as Record<string, unknown>;
    const mergedContent: Record<string, unknown> = { ...existing };
    if (dto.anamnese) mergedContent['anamnese'] = dto.anamnese;
    if (dto.exameFisico) mergedContent['exameFisico'] = dto.exameFisico;
    if (dto.diagnostico) mergedContent['diagnostico'] = dto.diagnostico;
    if (dto.prescricao) mergedContent['prescricao'] = dto.prescricao;

    const nextVersion = (lastVersion?.version ?? 0) + 1;

    return this.prisma.$transaction(async (trx) => {
      const updated = await trx.consultation.update({
        where: { id_tenantId: { id, tenantId } },
        data: {
          latestDraft: mergedContent as Prisma.InputJsonValue,
          clinicianId,
        },
      });

      await trx.consultationVersion.create({
        data: {
          consultationId: id,
          version: nextVersion,
          isFinal: false,
          content: mergedContent as Prisma.InputJsonValue,
        },
      });

      await trx.activityLog.create({
        data: {
          tenantId,
          actorId: clinicianId,
          action: 'AUTOSAVE',
          resource: 'consultation',
          metadata: { consultationId: id, version: nextVersion } as object,
        },
      });

      return updated;
    });
  }

  async finalize(tenantId: string, clinicianId: string, id: string) {
    const consultation = await this.prisma.consultation.findFirst({ where: { id, tenantId } });
    if (!consultation) {
      throw new NotFoundException('Consulta não encontrada');
    }

    const lastVersion = await this.prisma.consultationVersion.findFirst({
      where: { consultationId: id },
      orderBy: { version: 'desc' },
    });

    const version = (lastVersion?.version ?? 0) + 1;
    const content = (consultation.latestDraft ?? {}) as Record<string, unknown>;
    const hash = createHash('sha256').update(JSON.stringify(content)).digest('hex');

    return this.prisma.$transaction(async (trx) => {
      const finalized = await trx.consultation.update({
        where: { id_tenantId: { id, tenantId } },
        data: {
          status: ConsultationStatus.FINALIZED,
          finalizedAt: new Date(),
        },
      });

      await trx.consultationVersion.create({
        data: {
          consultationId: id,
          version,
          isFinal: true,
          content: content as Prisma.InputJsonValue,
          hash,
        },
      });

      await trx.activityLog.create({
        data: {
          tenantId,
          actorId: clinicianId,
          action: 'FINALIZE',
          resource: 'consultation',
          metadata: { consultationId: id, version, hash } as object,
        },
      });

      return {
        ...finalized,
        finalVersion: version,
        hash,
      };
    });
  }
}

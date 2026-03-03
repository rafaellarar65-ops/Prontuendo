import { createHash } from 'crypto';

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConsultationStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ListConsultationsDto } from './dto/list-consultations.dto';
import { SoapPdfService } from './soap-pdf.service';
import { UpsertConsultationSectionDto } from './dto/upsert-consultation-section.dto';

@Injectable()
export class ConsultationsService {
  private readonly logger = new Logger(ConsultationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly soapPdfService: SoapPdfService,
  ) {}

  async create(tenantId: string, clinicianId: string, dto: CreateConsultationDto) {
    const consultation = await this.prisma.consultation.create({
      data: {
        tenantId,
        patientId: dto.patientId,
        clinicianId,
        status: ConsultationStatus.DRAFT,
        latestDraft: {},
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

    const mergedContent = {
      ...(consultation.latestDraft as Record<string, unknown> | null),
      ...dto,
    } as Prisma.InputJsonObject;

    const nextVersion = (lastVersion?.version ?? 0) + 1;

    return this.prisma.$transaction(async (trx) => {
      const updated = await trx.consultation.update({
        where: { id_tenantId: { id, tenantId } },
        data: {
          latestDraft: mergedContent,
          clinicianId,
        },
      });

      await trx.consultationVersion.create({
        data: {
          consultationId: id,
          version: nextVersion,
          isFinal: false,
          content: mergedContent,
        },
      });

      await trx.activityLog.create({
        data: {
          tenantId,
          actorId: clinicianId,
          action: 'AUTOSAVE',
          resource: 'consultation',
          metadata: { consultationId: id, version: nextVersion },
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
    const content = (consultation.latestDraft ?? {}) as Prisma.InputJsonObject;
    const hash = createHash('sha256').update(JSON.stringify(content)).digest('hex');

    const finalized = await this.prisma.$transaction(async (trx) => {
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
          content,
          hash,
        },
      });

      await trx.activityLog.create({
        data: {
          tenantId,
          actorId: clinicianId,
          action: 'FINALIZE',
          resource: 'consultation',
          metadata: { consultationId: id, version, hash },
        },
      });

      return {
        ...finalized,
        finalVersion: version,
        hash,
      };
    });

    try {
      const latestDraft = (consultation.latestDraft ?? {}) as Record<string, unknown>;
      const pdf = await this.soapPdfService.createSoapSummaryPdf({
        tenantId,
        patientId: consultation.patientId,
        consultationId: id,
        latestDraft,
      });

      await this.prisma.$transaction(async (trx) => {
        const document = await trx.document.create({
          data: {
            tenantId,
            patientId: consultation.patientId,
            consultationId: id,
            category: 'RESUMO_CLINICO',
            fileName: pdf.fileName,
            filePath: pdf.relativePath,
            mimeType: pdf.mimeType,
            isFromPortal: false,
            createdBy: clinicianId,
          },
        });

        await trx.activityLog.create({
          data: {
            tenantId,
            actorId: clinicianId,
            action: 'FINALIZE_SOAP_PDF_CREATED',
            resource: 'consultation',
            metadata: {
              consultationId: id,
              documentId: document.id,
              filePath: pdf.relativePath,
            },
          },
        });
      });
    } catch (error) {
      // Política adotada: a consulta permanece finalizada e apenas a geração do PDF é tratada como falha não-bloqueante.
      // Motivo: o processo inclui I/O de filesystem, que não participa de transação ACID do banco.
      this.logger.error(`Falha ao gerar PDF SOAP para consulta ${id}`, error instanceof Error ? error.stack : undefined);

      await this.prisma.activityLog.create({
        data: {
          tenantId,
          actorId: clinicianId,
          action: 'FINALIZE_SOAP_PDF_FAILED',
          resource: 'consultation',
          metadata: {
            consultationId: id,
            error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar PDF SOAP',
          },
        },
      });
    }

    return finalized;
  }
}

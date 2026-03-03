import { randomUUID } from 'crypto';
import { access, copyFile, mkdir, rm, unlink, writeFile } from 'fs/promises';
import { basename, join, resolve } from 'path';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';


declare global {
  namespace Express {
    namespace Multer {
      interface File {
        originalname: string;
        mimetype: string;
        size: number;
        buffer?: Buffer;
        path?: string;
      }
    }
  }
}

type Item = { id: string; tenantId: string; payload: Record<string, unknown>; createdBy: string; createdAt: string; updatedAt: string };

export type DocumentUploadMetadata = {
  patientId: string;
  category: string;
  description: string;
  consultationId?: string;
  isFromPortal?: boolean;
};

export type DocumentFilters = {
  category?: string;
  consultationId?: string;
  isFromPortal?: boolean;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf', 'image/webp']);
const UPLOADS_ROOT = resolve(process.cwd(), 'uploads');

@Injectable()
export class DocumentsService {
  private readonly store: Item[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private documentRepo() {
    return (this.prisma as any).document;
  }

  private async ensurePatientInTenant(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { tenantId, id: patientId }, select: { id: true } });
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado para este tenant');
    }
  }

  private validateUploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Arquivo excede o limite de 10MB');
    }
  }

  private async persistFile(absoluteTargetPath: string, file: Express.Multer.File) {
    if (file.buffer && file.buffer.length) {
      await writeFile(absoluteTargetPath, file.buffer);
      return;
    }

    if (file.path) {
      await copyFile(file.path, absoluteTargetPath);
      return;
    }

    throw new BadRequestException('Arquivo inválido para upload');
  }

  async upload(tenantId: string, metadata: DocumentUploadMetadata, file: Express.Multer.File) {
    this.validateUploadFile(file);

    await this.ensurePatientInTenant(tenantId, metadata.patientId);

    if (metadata.consultationId) {
      const consultation = await this.prisma.consultation.findFirst({
        where: { id: metadata.consultationId, tenantId, patientId: metadata.patientId },
        select: { id: true },
      });

      if (!consultation) {
        throw new NotFoundException('Consulta não encontrada para tenant/paciente informado');
      }
    }

    const safeFileName = basename(file.originalname || 'upload.bin').replace(/\s+/g, '_');
    const fileName = `${randomUUID()}_${safeFileName}`;
    const storageKey = `${tenantId}/${metadata.patientId}/${fileName}`;
    const uploadDir = join(UPLOADS_ROOT, tenantId, metadata.patientId);
    const absoluteFilePath = join(UPLOADS_ROOT, storageKey);

    await mkdir(uploadDir, { recursive: true });
    await this.persistFile(absoluteFilePath, file);

    try {
      return await this.documentRepo().create({
        data: {
          tenantId,
          patientId: metadata.patientId,
          category: metadata.category,
          description: metadata.description,
          consultationId: metadata.consultationId ?? null,
          isFromPortal: metadata.isFromPortal ?? false,
          storageKey,
          fileName: safeFileName,
          mimeType: file.mimetype,
          size: file.size,
        },
      });
    } catch (error) {
      await rm(absoluteFilePath, { force: true });
      throw error;
    }
  }

  async findByPatient(tenantId: string, patientId: string, filters: DocumentFilters = {}) {
    await this.ensurePatientInTenant(tenantId, patientId);

    return this.documentRepo().findMany({
      where: {
        tenantId,
        patientId,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.consultationId ? { consultationId: filters.consultationId } : {}),
        ...(typeof filters.isFromPortal === 'boolean' ? { isFromPortal: filters.isFromPortal } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(tenantId: string, documentId: string) {
    const document = await this.documentRepo().findFirst({
      where: {
        id: documentId,
        tenantId,
      },
    });

    if (!document) {
      throw new NotFoundException('Documento não encontrado');
    }

    await this.ensurePatientInTenant(tenantId, document.patientId);
    return document;
  }

  async download(tenantId: string, documentId: string) {
    const document = await this.findById(tenantId, documentId);
    const absolutePath = join(UPLOADS_ROOT, document.storageKey);

    try {
      await access(absolutePath);
    } catch {
      throw new NotFoundException('Arquivo do documento não encontrado no armazenamento');
    }

    return absolutePath;
  }

  async delete(tenantId: string, documentId: string) {
    const document = await this.findById(tenantId, documentId);
    const absolutePath = join(UPLOADS_ROOT, document.storageKey);

    await this.documentRepo().delete({ where: { id: document.id } });
    await unlink(absolutePath).catch(() => undefined);

    return { deleted: true };
  }

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

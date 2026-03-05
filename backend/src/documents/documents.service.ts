import { access, copyFile, mkdir, rm, unlink, writeFile } from 'fs/promises';
import { basename, join, relative, resolve, sep } from 'path';
import { randomUUID } from 'crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';


interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

export type DocumentUploadMetadata = {
  patientId: string;
  category: string;
  description: string;
  consultationId?: string;
  isFromPortal?: boolean;
  uploadedById?: string;
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
  constructor(private readonly prisma: PrismaService) {}

  private documentRepo() {
    return (this.prisma as any).document;
  }

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }
  }

  private async ensurePatientInTenant(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { tenantId, id: patientId }, select: { id: true } });
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado para este tenant');
    }
  }

  private validateUploadFile(file: UploadedFile) {
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

  private async persistFile(absoluteTargetPath: string, file: UploadedFile) {
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

  async upload(tenantId: string, metadata: DocumentUploadMetadata, file: UploadedFile) {
    this.validateUploadFile(file);

    await this.ensureTenantExists(tenantId);
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
    const defaultFileName = `${randomUUID()}_${safeFileName}`;
    const uploadDir = join(UPLOADS_ROOT, tenantId, metadata.patientId);

    let storageKey: string;
    let absoluteFilePath: string | null = null;

    if (file.path) {
      const relativeStoragePath = relative(UPLOADS_ROOT, file.path);
      if (!relativeStoragePath || relativeStoragePath.startsWith('..')) {
        throw new BadRequestException('Caminho de upload inválido');
      }
      storageKey = relativeStoragePath.split(sep).join('/');
    } else {
      await mkdir(uploadDir, { recursive: true });
      storageKey = `${tenantId}/${metadata.patientId}/${defaultFileName}`;
      absoluteFilePath = join(UPLOADS_ROOT, storageKey);
      await this.persistFile(absoluteFilePath, file);
    }

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
          fileSize: file.size,
          uploadedById: metadata.uploadedById ?? null,
        },
      });
    } catch (error) {
      if (absoluteFilePath) {
        await rm(absoluteFilePath, { force: true });
      }
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
    const storageKey = document.storageKey ?? document.filePath;
    const absolutePath = join(UPLOADS_ROOT, storageKey);

    try {
      await access(absolutePath);
    } catch {
      throw new NotFoundException('Arquivo do documento não encontrado no armazenamento');
    }

    return absolutePath;
  }

  async delete(tenantId: string, documentId: string) {
    const document = await this.findById(tenantId, documentId);
    const storageKey = document.storageKey ?? document.filePath;
    const absolutePath = join(UPLOADS_ROOT, storageKey);

    await this.documentRepo().delete({ where: { id: document.id } });
    await unlink(absolutePath).catch(() => undefined);

    return { deleted: true };
  }
}

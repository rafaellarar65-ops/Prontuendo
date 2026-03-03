import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, resolve } from 'path';
import { randomUUID } from 'crypto';

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { UploadDocumentDto } from './dto/upload-document.dto';

type UploadedDocumentFile = {
  originalname: string;
  mimetype: string;
  path?: string;
  buffer?: Buffer;
};

type Item = {
  id: string;
  tenantId: string;
  patientId: string;
  category: string;
  description?: string;
  consultationId?: string;
  tags?: string[];
  createdBy: string;
  createdAt: string;
  originalName: string;
  mimeType: string;
  absolutePath: string;
};

@Injectable()
export class DocumentsService {
  private readonly store: Item[] = [];

  async upload(tenantId: string, actorId: string, file: UploadedDocumentFile | undefined, dto: UploadDocumentDto) {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const absolutePath = await this.persistFile(file);

    const item: Item = {
      id: randomUUID(),
      tenantId,
      patientId: dto.patientId,
      category: dto.category,
      description: dto.description,
      consultationId: dto.consultationId,
      tags: dto.tags,
      createdBy: actorId,
      createdAt: new Date().toISOString(),
      originalName: file.originalname,
      mimeType: file.mimetype,
      absolutePath,
    };

    this.store.push(item);
    return item;
  }

  listByPatient(tenantId: string, patientId: string, category?: string) {
    return this.store.filter(
      (item) => item.tenantId === tenantId && item.patientId === patientId && (!category || item.category === category),
    );
  }

  findOne(tenantId: string, id: string) {
    const item = this.store.find((entry) => entry.tenantId === tenantId && entry.id === id);
    if (!item) {
      throw new NotFoundException('Documento não encontrado');
    }

    return item;
  }

  getDownloadInfo(tenantId: string, id: string) {
    const item = this.findOne(tenantId, id);
    return {
      absolutePath: item.absolutePath,
      filename: item.originalName,
    };
  }

  async remove(tenantId: string, id: string) {
    const index = this.store.findIndex((entry) => entry.tenantId === tenantId && entry.id === id);
    if (index < 0) {
      return { deleted: false };
    }

    const [item] = this.store.splice(index, 1);
    try {
      await unlink(item.absolutePath);
    } catch {
      // Ignora erro caso o arquivo já tenha sido removido
    }

    return { deleted: true };
  }

  private async persistFile(file: UploadedDocumentFile) {
    if (file.path) {
      return resolve(file.path);
    }

    if (!file.buffer) {
      throw new BadRequestException('Não foi possível ler o arquivo enviado');
    }

    const uploadsDir = resolve(process.cwd(), 'tmp', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const filename = `${randomUUID()}-${basename(file.originalname)}`;
    const absolutePath = resolve(uploadsDir, filename);
    await writeFile(absolutePath, file.buffer);

    return absolutePath;
  }
}

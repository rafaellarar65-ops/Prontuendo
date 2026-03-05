import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import path from 'path';

import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

const uploadsRoot = path.join(process.cwd(), 'uploads');
const acceptedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const sanitizeFileName = (fileName: string) =>
  path
    .basename(fileName || 'upload.bin')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const extractId = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length ? normalized : null;
};

mkdirSync(uploadsRoot, { recursive: true });

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req: { user?: { tenantId?: string }; body?: { patientId?: string } }, _file, callback) => {
          const tenantId = extractId(req.user?.tenantId);
          const patientId = extractId(req.body?.patientId);

          if (!tenantId || !patientId) {
            callback(new BadRequestException('tenantId e patientId são obrigatórios para upload'), uploadsRoot);
            return;
          }

          const uploadDir = path.join(uploadsRoot, tenantId, patientId);
          mkdirSync(uploadDir, { recursive: true });
          callback(null, uploadDir);
        },
        filename: (_req, file, callback) => {
          const sanitizedName = sanitizeFileName(file.originalname);
          callback(null, `${randomUUID()}_${sanitizedName || 'upload.bin'}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req: unknown, file: { mimetype: string }, callback: (error: Error | null, acceptFile: boolean) => void) => {
        if (!acceptedMimeTypes.has(file.mimetype)) {
          callback(new BadRequestException('Tipo de arquivo não permitido'), false);
          return;
        }

        callback(null, true);
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

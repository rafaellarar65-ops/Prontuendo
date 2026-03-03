import { mkdirSync } from 'fs';
import path from 'path';

import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

const uploadsRoot = path.join(process.cwd(), 'uploads');
const acceptedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

mkdirSync(uploadsRoot, { recursive: true });

@Module({
  imports: [
    MulterModule.register({
      dest: uploadsRoot,
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

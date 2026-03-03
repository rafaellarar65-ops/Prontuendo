import { Body, Controller, Delete, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';

type UploadDocumentBody = {
  patientId: string;
  category: string;
  description: string;
  consultationId?: string;
  isFromPortal?: boolean | string;
};

type DocumentsQuery = {
  patientId: string;
  category?: string;
};

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  private parseOptionalBoolean(value: boolean | string | undefined) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') {
        return true;
      }

      if (value.toLowerCase() === 'false') {
        return false;
      }
    }

    return undefined;
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload de documento do paciente' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        patientId: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
        consultationId: { type: 'string' },
        isFromPortal: { type: 'boolean' },
      },
      required: ['file', 'patientId', 'category', 'description'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadDocumentBody,
  ) {
    return this.service.upload(
      user.tenantId,
      {
        patientId: body.patientId,
        category: body.category,
        description: body.description,
        consultationId: body.consultationId,
        isFromPortal: this.parseOptionalBoolean(body.isFromPortal),
      },
      file,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar documentos por paciente' })
  @ApiQuery({ name: 'patientId', required: true })
  @ApiQuery({ name: 'category', required: false })
  list(@CurrentUser() user: AuthUser, @Query() query: DocumentsQuery) {
    return this.service.findByPatient(user.tenantId, query.patientId, { category: query.category });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter metadados de um documento' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Baixar arquivo de documento' })
  async download(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const document = await this.service.findById(user.tenantId, id);
    const absolutePath = await this.service.download(user.tenantId, id);

    return res.sendFile(absolutePath, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento e arquivo' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.delete(user.tenantId, id);
  }
}

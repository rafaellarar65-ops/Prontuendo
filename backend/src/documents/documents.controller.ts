import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'fs';

import { CurrentUser, type AuthUser } from '../common/decorators/current-user.decorator';
import { DocumentsService, type DocumentFilters } from './documents.service';

type UploadDocumentBody = {
  patientId: string;
  category: string;
  description: string;
  consultationId?: string;
  isFromPortal?: boolean | string;
};

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'patientId', 'category', 'description'],
      properties: {
        file: { type: 'string', format: 'binary' },
        patientId: { type: 'string' },
        category: { type: 'string' },
        description: { type: 'string' },
        consultationId: { type: 'string' },
        isFromPortal: { type: 'boolean' },
      },
    },
  })
  @ApiOperation({ summary: 'Enviar documento' })
  upload(@CurrentUser() user: AuthUser, @Body() body: UploadDocumentBody, @UploadedFile() file: Express.Multer.File) {
    return this.service.upload(
      user.tenantId,
      {
        ...body,
        isFromPortal: body.isFromPortal === true || body.isFromPortal === 'true',
        uploadedById: user.sub,
      },
      file,
    );
  }

  @Get('patients/:patientId')
  @ApiOperation({ summary: 'Listar documentos por paciente' })
  findByPatient(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string, @Query() filters: DocumentFilters) {
    return this.service.findByPatient(user.tenantId, patientId, filters);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Listar documentos do paciente' })
  listByPatient(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Query('category') category?: string,
  ) {
    return this.service.findByPatient(user.tenantId, patientId, category ? { category } : {});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  findById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Baixar arquivo do documento' })
  async download(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res({ passthrough: true }) res: any) {
    const absolutePath = await this.service.download(user.tenantId, id);
    const stream = createReadStream(absolutePath);
    res.setHeader('Content-Type', 'application/octet-stream');
    return new StreamableFile(stream);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.delete(user.tenantId, id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de documento' })
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: { originalname: string; mimetype: string; path?: string; buffer?: Buffer },
    @Body() dto: UploadDocumentDto,
  ) {
    return this.service.upload(user.tenantId, user.sub, file, dto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Listar documentos do paciente' })
  listByPatient(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Query('category') category?: string,
  ) {
    return this.service.listByPatient(user.tenantId, patientId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar documento por ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download de documento' })
  async download(@CurrentUser() user: AuthUser, @Param('id') id: string, @Res() res: Response) {
    const file = await this.service.getDownloadInfo(user.tenantId, id);
    res.sendFile(file.absolutePath);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover documento' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }
}

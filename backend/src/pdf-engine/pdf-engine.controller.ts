import { Body, Controller, Delete, Get, Param, Patch, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { GenericPayloadDto } from '../common/dto/generic-payload.dto';
import { PdfEngineService } from './pdf-engine.service';

@ApiTags('pdf-engine')
@ApiBearerAuth()
@Controller('pdf-engine')
export class PdfEngineController {
  constructor(private readonly service: PdfEngineService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros do módulo' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar registro do módulo' })
  create(@CurrentUser() user: AuthUser, @Body() dto: GenericPayloadDto) {
    return this.service.create(user.tenantId, user.sub, dto.payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar registro do módulo' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: GenericPayloadDto) {
    return this.service.update(user.tenantId, id, dto.payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro do módulo' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }

  @Post('render')
  @ApiOperation({ summary: 'Renderizar PDF via engine' })
  async render(@Body() dto: GenericPayloadDto, @Res({ passthrough: true }) response: Response) {
    const payload = dto.payload as { canvasJson?: unknown };
    const pdfBuffer = await this.service.renderPdf(payload.canvasJson ?? dto.payload);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'inline; filename="template.pdf"');

    return new StreamableFile(pdfBuffer);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Status de job PDF' })
  status(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.execute('status', user.tenantId, user.sub, { id });
  }
}

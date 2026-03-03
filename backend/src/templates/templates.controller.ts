import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { PdfEngineService } from '../pdf-engine/pdf-engine.service';
import { VariableResolverService } from '../variable-resolver/variable-resolver.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { RenderTemplateDto } from './dto/render-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly service: TemplatesService,
    private readonly variableResolverService: VariableResolverService,
    private readonly pdfEngineService: PdfEngineService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar templates' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar template' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar template' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover template' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }

  @Post(':templateId/render')
  @ApiOperation({ summary: 'Renderizar template com variáveis resolvidas' })
  render(
    @CurrentUser() user: AuthUser,
    @Param('templateId') templateId: string,
    @Body() dto: RenderTemplateDto,
  ) {
    const template = this.service.findOne(user.tenantId, templateId);
    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    const canvasJson = this.variableResolverService.resolveCanvas(template.canvasJson, dto);
    return { canvasJson };
  }

  @Post(':templateId/pdf')
  @ApiOperation({ summary: 'Gerar PDF de template' })
  pdf(
    @CurrentUser() user: AuthUser,
    @Param('templateId') templateId: string,
    @Body() dto: RenderTemplateDto,
    @Res() res: Response,
  ) {
    const template = this.service.findOne(user.tenantId, templateId);
    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    const canvasJson = this.variableResolverService.resolveCanvas(template.canvasJson, dto);
    const pdf = this.pdfEngineService.renderTemplatePdf(templateId, canvasJson);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="template-${templateId}.pdf"`);
    res.send(pdf);
  }
}

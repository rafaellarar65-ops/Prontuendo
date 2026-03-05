import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { GenericPayloadDto } from '../common/dto/generic-payload.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros do módulo' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.tenantId);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Buscar templates por categoria' })
  findByCategory(@CurrentUser() user: AuthUser, @Param('category') category: string) {
    return this.service.findByCategory(user.tenantId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar template por id' })
  findById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar registro do módulo' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTemplateDto) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar template' })
  duplicate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.duplicate(user.tenantId, id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar registro do módulo' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro do módulo' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.delete(user.tenantId, id);
  }

  @Post('render')
  @ApiOperation({ summary: 'Renderização de template' })
  render(@CurrentUser() user: AuthUser, @Body() dto: GenericPayloadDto) {
    return this.service.execute('render', user.tenantId, user.sub, dto.payload);
  }

  @Post(':id/export-pdf')
  @ApiOperation({ summary: 'Exportar template em PDF' })
  exportPdf(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: GenericPayloadDto) {
    return this.service.execute('export-pdf', user.tenantId, user.sub, { id, ...dto.payload });
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { ListConsultationsDto } from './dto/list-consultations.dto';
import { UpsertConsultationSectionDto } from './dto/upsert-consultation-section.dto';

@ApiTags('consultations')
@ApiBearerAuth()
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Post()
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Criar consulta em rascunho' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(user.tenantId, user.sub, dto);
  }

  @Get()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Listar consultas com filtros' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListConsultationsDto) {
    return this.consultationsService.findAll(user.tenantId, query);
  }

  @Patch(':id/autosave')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Auto-save da consulta SOAP com versionamento' })
  autosave(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpsertConsultationSectionDto) {
    return this.consultationsService.autosave(user.tenantId, user.sub, id, dto);
  }

  @Post(':id/finalize')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Finaliza consulta e gera hash da versão final' })
  finalize(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.consultationsService.finalize(user.tenantId, user.sub, id);
  }
}

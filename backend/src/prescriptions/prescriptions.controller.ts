import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ListPrescriptionsDto } from './dto/list-prescriptions.dto';
import { DuplicatePrescriptionDto, SearchMedicationDto, SignPrescriptionDto } from './dto/prescription-actions.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar prescrição' })
  @ApiBody({ type: CreatePrescriptionDto })
  @ApiOkResponse({ description: 'Prescrição criada com sucesso' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePrescriptionDto) {
    return this.service.create(user.tenantId, user.sub, dto as unknown as Record<string, unknown>);
  }

  @Get()
  @ApiOperation({ summary: 'Listar prescrições com filtros' })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'consultationId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ATIVA', 'CANCELADA'] })
  @ApiOkResponse({ description: 'Lista de prescrições' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListPrescriptionsDto) {
    return this.service.list(user.tenantId, query as unknown as Record<string, unknown>);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar prescrição' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Prescrição encontrada' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar prescrição' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePrescriptionDto })
  @ApiOkResponse({ description: 'Prescrição atualizada com sucesso' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.service.update(user.tenantId, id, dto as unknown as Record<string, unknown>);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar prescrição' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Prescrição cancelada com sucesso' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancel(user.tenantId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar prescrição' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: DuplicatePrescriptionDto })
  @ApiOkResponse({ description: 'Prescrição duplicada com sucesso' })
  duplicate(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: DuplicatePrescriptionDto) {
    return this.service.renew(user.tenantId, id, dto.validUntil ?? null);
  }

  @Post('search-medication')
  @ApiOperation({ summary: 'Busca de medicamentos (pharmacopoeia)' })
  @ApiBody({ type: SearchMedicationDto })
  @ApiOkResponse({ description: 'Resultado da busca de medicamentos' })
  searchMedication(@CurrentUser() user: AuthUser, @Body() dto: SearchMedicationDto) {
    return this.service.searchMedication(user.tenantId, user.sub, dto as unknown as Record<string, unknown>);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Assinatura digital de prescrição' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: SignPrescriptionDto })
  @ApiOkResponse({ description: 'Solicitação de assinatura enviada' })
  sign(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SignPrescriptionDto) {
    return this.service.execute('sign', user.tenantId, user.sub, { id, ...(dto as unknown as Record<string, unknown>) });
  }
}

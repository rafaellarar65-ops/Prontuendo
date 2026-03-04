import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { GenericPayloadDto } from '../common/dto/generic-payload.dto';
import { AgendaService } from './agenda.service';

@ApiTags('agenda')
@ApiBearerAuth()
@Controller('agenda')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  list(@CurrentUser() user: AuthUser, @Query('date') date?: string, @Query('patientId') patientId?: string) {
    if (patientId) {
      return this.service.findByPatient(user.tenantId, patientId);
    }

    if (date) {
      return this.service.findByDate(user.tenantId, date);
    }

    return this.service.findAll(user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar agendamento' })
  create(@CurrentUser() user: AuthUser, @Body() dto: GenericPayloadDto) {
    return this.service.create(user.tenantId, user.sub, dto.payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: GenericPayloadDto) {
    if (dto.payload.status && Object.keys(dto.payload).length === 1) {
      return this.service.updateStatus(
        user.tenantId,
        id,
        String(dto.payload.status) as 'AGENDADO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO',
      );
    }

    return this.service.update(user.tenantId, id, dto.payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover agendamento' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }
}

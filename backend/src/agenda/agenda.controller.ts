import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AgendaService } from './agenda.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { DateQueryDto } from './dto/date-query.dto';
import { RangeQueryDto } from './dto/range-query.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';

@ApiTags('agenda')
@ApiBearerAuth()
@Controller('agenda')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Listar agenda por data' })
  findByDate(@CurrentUser() user: AuthUser, @Query() query: DateQueryDto) {
    return { data: this.service.findByDate(user.tenantId, query.date) };
  }

  @Get('patient/:patientId')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Listar agenda por paciente' })
  findByPatient(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return { data: this.service.findByPatient(user.tenantId, patientId) };
  }

  @Get('range')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Listar agenda por intervalo de datas' })
  findByRange(@CurrentUser() user: AuthUser, @Query() query: RangeQueryDto) {
    return { data: this.service.findByRange(user.tenantId, query.start, query.end) };
  }

  @Get('available-slots')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Consultar slots disponíveis' })
  availableSlots(@CurrentUser() user: AuthUser, @Query() query: AvailableSlotsQueryDto) {
    return { data: this.service.findAvailableSlots(user.tenantId, query.clinicianId, query.date, query.durationMin) };
  }

  @Post()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Criar evento na agenda' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAgendaDto) {
    return { data: this.service.create(user.tenantId, user.sub, dto) };
  }

  @Patch(':id')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Atualizar evento da agenda' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAgendaDto) {
    return { data: this.service.update(user.tenantId, id, dto) };
  }

  @Delete(':id')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Remover evento da agenda' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: this.service.remove(user.tenantId, id) };
  }
}

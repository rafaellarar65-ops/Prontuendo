import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AgendaService } from './agenda.service';

@ApiTags('agenda')
@ApiBearerAuth()
@Controller('agenda')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListAppointmentsDto) {
    return this.service.list(user.tenantId, query);
  }

  @Get('date/:date')
  @ApiOperation({ summary: 'Listar agendamentos por data' })
  listByDate(@CurrentUser() user: AuthUser, @Param('date') date: string) {
    return this.service.findByDate(user.tenantId, date);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Listar agendamentos por paciente' })
  listByPatient(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.service.findByPatient(user.tenantId, patientId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar agendamento' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do agendamento' })
  updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.service.updateStatus(user.tenantId, id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover agendamento' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { AgendaService } from './agenda.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto';

@ApiTags('agenda')
@ApiBearerAuth()
@Controller('agenda')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar agendamentos (opcional: filtrar por data)' })
  @ApiQuery({ name: 'date', required: false, description: 'Filtrar por data (YYYY-MM-DD)' })
  list(@CurrentUser() user: AuthUser, @Query('date') date?: string) {
    return this.service.list(user.tenantId, date);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Listar agendamentos de um paciente' })
  listByPatient(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.service.listByPatient(user.tenantId, patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar agendamento por ID' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo agendamento' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAppointmentDto) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar agendamento' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover agendamento' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }
}

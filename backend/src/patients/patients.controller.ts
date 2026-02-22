import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PatientGuard } from '../common/guards/patient.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ListPatientsDto } from './dto/list-patients.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Criar paciente' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(user.tenantId, user.sub, dto);
  }

  @Get()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Listar pacientes com filtros' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListPatientsDto) {
    return this.patientsService.findAll(user.tenantId, query);
  }

  @Patch(':id')
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @UseGuards(PatientGuard)
  @ApiOperation({ summary: 'Atualizar paciente' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(user.tenantId, user.sub, id, dto);
  }

  @Delete(':id')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Remover paciente' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.patientsService.remove(user.tenantId, user.sub, id);
  }
}

import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';

class RenewPrescriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

class ListPrescriptionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;
}

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Post()
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Criar prescrição' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePrescriptionDto) {
    return this.service.createPrescription(user.tenantId, user.sub, dto);
  }

  @Get()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Listar prescrições por paciente' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListPrescriptionsQueryDto) {
    return this.service.listByPatient(user.tenantId, query.patientId);
  }

  @Get('consultation/:consultationId')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Listar prescrições por consulta' })
  listByConsultation(@CurrentUser() user: AuthUser, @Param('consultationId') consultationId: string) {
    return this.service.listByConsultation(user.tenantId, consultationId);
  }

  @Get('active')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Listar prescrições ativas por paciente' })
  listActive(@CurrentUser() user: AuthUser, @Query() query: ListPrescriptionsQueryDto) {
    return this.service.listActiveByPatient(user.tenantId, query.patientId);
  }

  @Patch(':id/cancel')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Cancelar prescrição' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancel(user.tenantId, user.sub, id);
  }

  @Post(':id/renew')
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Renovar prescrição' })
  renew(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RenewPrescriptionDto) {
    return this.service.renew(user.tenantId, user.sub, id, dto.validUntil);
  }
}

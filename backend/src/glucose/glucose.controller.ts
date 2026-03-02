import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateGlucoseLogDto } from './dto/create-glucose-log.dto';
import { GlucoseService } from './glucose.service';

@ApiTags('glucose')
@ApiBearerAuth()
@Controller('glucose')
export class GlucoseController {
  constructor(private readonly glucoseService: GlucoseService) {}

  @Post()
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'Criar registro glicêmico' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGlucoseLogDto) {
    return this.glucoseService.create(user.tenantId, dto.patientId, dto, user.sub);
  }

  @Get()
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'Listar registros glicêmicos por paciente' })
  @ApiQuery({ name: 'patientId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByPatient(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    return this.glucoseService.findByPatient(user.tenantId, patientId, parsedLimit);
  }

  @Get('analyze')
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'Análise glicêmica com base nos últimos 30 registros' })
  @ApiQuery({ name: 'patientId', required: true, type: String })
  analyze(@CurrentUser() user: AuthUser, @Query('patientId') patientId: string) {
    return this.glucoseService.analyzeGlucose(user.tenantId, patientId);
  }
}

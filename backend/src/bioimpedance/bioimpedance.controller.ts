import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BioimpedanceService } from './bioimpedance.service';
import { CreateBioimpedanceDto } from './dto/create-bioimpedance.dto';

@ApiTags('bioimpedance')
@ApiBearerAuth()
@Controller('bioimpedance')
export class BioimpedanceController {
  constructor(private readonly bioimpedanceService: BioimpedanceService) {}

  @Post()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Criar exame de bioimpedância' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBioimpedanceDto) {
    return this.bioimpedanceService.create(user.tenantId, dto.patientId, dto);
  }

  @Get()
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'Listar exames de bioimpedância por paciente' })
  @ApiQuery({ name: 'patientId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByPatient(@CurrentUser() user: AuthUser, @Query('patientId') patientId: string, @Query('limit') limit?: string) {
    return this.bioimpedanceService.findByPatient(user.tenantId, patientId, limit ? Number(limit) : 50);
  }
}

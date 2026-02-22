import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { LabResultsService } from './lab-results.service';

@ApiTags('lab-results')
@ApiBearerAuth()
@Controller('lab-results')
export class LabResultsController {
  constructor(private readonly labResultsService: LabResultsService) {}

  @Post()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Criar resultado de exame laboratorial' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLabResultDto) {
    return this.labResultsService.create(user.tenantId, user.sub, dto);
  }

  @Get(':patientId/history')
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'Histórico comparativo de exames do paciente' })
  history(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Query('examName') examName?: string,
  ) {
    return this.labResultsService.history(user.tenantId, patientId, examName);
  }

  @Post('extract')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Extração de resultados via IA' })
  extract(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.labResultsService.extract(user.tenantId, user.sub, payload);
  }
}

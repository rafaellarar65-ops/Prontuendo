import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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
    return this.bioimpedanceService.create(user.tenantId, user.sub, dto);
  }

  @Post('extract')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Extrair bioimpedância de arquivo via IA' })
  extract(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.bioimpedanceService.extract(user.tenantId, user.sub, payload);
  }

  @Get(':patientId/evolution')
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'Dados de evolução temporal para gráficos' })
  evolution(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.bioimpedanceService.evolution(user.tenantId, patientId);
  }

  @Post(':id/report')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Geração de relatório PDF de bioimpedância' })
  report(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.bioimpedanceService.report(user.tenantId, user.sub, id);
  }
}

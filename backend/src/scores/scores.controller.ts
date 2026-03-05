import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleEnum } from '../common/enums/role.enum';
import { CalculateScoreDto } from './dto/calculate-score.dto';
import { ListScoresDto } from './dto/list-scores.dto';
import { ScoresService } from './scores.service';

@ApiTags('scores')
@ApiBearerAuth()
@Controller('scores')
export class ScoresController {
  constructor(private readonly service: ScoresService) {}

  @Post('calculate')
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Calcular e registrar escore do paciente' })
  calculate(@CurrentUser() user: AuthUser, @Body() dto: CalculateScoreDto) {
    return this.service.calculate(user.tenantId, user.sub, dto);
  }

  @Get()
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Listar escores por filtros' })
  list(@CurrentUser() user: AuthUser, @Query() dto: ListScoresDto) {
    return this.service.list(user.tenantId, user.sub, dto);
  }

  @Get('latest')
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Buscar último escore do paciente' })
  latest(@CurrentUser() user: AuthUser, @Query('patientId') patientId: string) {
    return this.service.latest(user.tenantId, user.sub, patientId);
  }
}

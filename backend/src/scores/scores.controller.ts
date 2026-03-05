import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleEnum } from '../common/enums/role.enum';
import { BmiDto } from './dto/bmi.dto';
import { BmrDto } from './dto/bmr.dto';
import { CkdEpiDto } from './dto/ckd-epi.dto';
import { FindriscDto } from './dto/findrisc.dto';
import { HomaIrDto } from './dto/homa-ir.dto';
import { ListScoresDto } from './dto/list-scores.dto';
import { ScoresService } from './scores.service';

@ApiTags('scores')
@ApiBearerAuth()
@Controller('scores')
export class ScoresController {
  constructor(private readonly service: ScoresService) {}

  @Post('calculate/homa-ir')
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Calcular e registrar HOMA-IR' })
  @ApiQuery({ name: 'patientId', required: true })
  calculateHomaIr(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId: string,
    @Body() dto: HomaIrDto,
  ) {
    return this.service.calculateHomaIr(user.tenantId, user.sub, patientId, dto);
  }

  @Post('calculate/bmi')
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Calcular e registrar IMC (BMI)' })
  @ApiQuery({ name: 'patientId', required: true })
  calculateBmi(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId: string,
    @Body() dto: BmiDto,
  ) {
    return this.service.calculateBmi(user.tenantId, user.sub, patientId, dto);
  }

  @Post('calculate/findrisc')
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Calcular e registrar FINDRISC' })
  @ApiQuery({ name: 'patientId', required: true })
  calculateFindrisc(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId: string,
    @Body() dto: FindriscDto,
  ) {
    return this.service.calculateFindrisc(user.tenantId, user.sub, patientId, dto);
  }

  @Post('calculate/bmr')
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Calcular e registrar BMR' })
  @ApiQuery({ name: 'patientId', required: true })
  calculateBmr(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId: string,
    @Body() dto: BmrDto,
  ) {
    return this.service.calculateBmr(user.tenantId, user.sub, patientId, dto);
  }

  @Post('calculate/ckd-epi')
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Calcular e registrar CKD-EPI' })
  @ApiQuery({ name: 'patientId', required: true })
  calculateCkdEpi(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId: string,
    @Body() dto: CkdEpiDto,
  ) {
    return this.service.calculateCkdEpi(user.tenantId, user.sub, patientId, dto);
  }

  @Get('history/:patientId/:scoreName')
  @Roles(RoleEnum.MEDICO)
  @ApiOperation({ summary: 'Listar histórico de um score por paciente' })
  @ApiParam({ name: 'patientId', required: true })
  @ApiParam({ name: 'scoreName', required: true })
  history(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Param('scoreName') scoreName: string,
  ) {
    return this.service.history(user.tenantId, user.sub, patientId, scoreName);
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
  @ApiQuery({ name: 'patientId', required: true })
  latest(@CurrentUser() user: AuthUser, @Query('patientId') patientId: string) {
    return this.service.latest(user.tenantId, user.sub, patientId);
  }
}

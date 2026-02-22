import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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
    return this.glucoseService.create(user.tenantId, user.sub, dto);
  }

  @Get(':patientId/stats')
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'Estatísticas de glicemia (TIR, média, desvio padrão)' })
  stats(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.glucoseService.stats(user.tenantId, patientId);
  }

  @Post('read-image')
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'OCR de glicosímetro via IA' })
  readImage(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.glucoseService.readImage(user.tenantId, user.sub, payload);
  }
}

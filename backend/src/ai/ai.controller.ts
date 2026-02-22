import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-document')
  @Roles('MEDICO', 'RECEPCAO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Proxy seguro para análise de documentos por IA' })
  analyzeDocument(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.proxy('analyze-document', user.tenantId, user.sub, payload);
  }

  @Post('assist-consultation')
  @Roles('MEDICO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Assistência durante consulta' })
  assistConsultation(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.proxy('assist-consultation', user.tenantId, user.sub, payload);
  }

  @Post('extract-bioimpedance')
  @Roles('MEDICO', 'RECEPCAO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Extração de bioimpedância por IA' })
  extractBioimpedance(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.proxy('extract-bioimpedance', user.tenantId, user.sub, payload);
  }

  @Post('read-glucometer')
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Leitura OCR de glicosímetro por IA' })
  readGlucometer(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.proxy('read-glucometer', user.tenantId, user.sub, payload);
  }

  @Post('suggest-protocol')
  @Roles('MEDICO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sugestão de protocolo clínico por IA' })
  suggestProtocol(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.proxy('suggest-protocol', user.tenantId, user.sub, payload);
  }
}

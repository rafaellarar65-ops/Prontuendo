import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AiService, AssistConsultationPayload } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('assist-consultation')
  @Roles('MEDICO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Assistente clínico durante consulta (Gemini)' })
  assistConsultation(@CurrentUser() user: AuthUser, @Body() payload: AssistConsultationPayload) {
    if (!payload.patientId || typeof payload.patientId !== 'string' || payload.patientId.trim().length === 0) {
      throw new BadRequestException('Informe o patientId para usar o assistente de consulta.');
    }

    return this.aiService.assistConsultation(user.tenantId, user.sub, payload);
  }

  @Post('extract-lab')
  @Roles('MEDICO', 'RECEPCAO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Extração de exames laboratoriais (Gemini)' })
  extractLab(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.extractLab(user.tenantId, user.sub, payload);
  }

  @Post('extract-bioimpedance')
  @Roles('MEDICO', 'RECEPCAO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Extração de bioimpedância por IA (Gemini)' })
  extractBioimpedance(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.extractBioimpedance(user.tenantId, user.sub, payload);
  }

  @Post('read-glucometer')
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Leitura OCR de glicosímetro (Gemini)' })
  readGlucometer(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.readGlucometer(user.tenantId, user.sub, payload);
  }

  @Post('patient-evolution')
  @Roles('MEDICO')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Análise de evolução longitudinal do paciente (Gemini)' })
  patientEvolution(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.analyzePatientEvolution(user.tenantId, user.sub, payload);
  }

  @Post('suggest-protocol')
  @Roles('MEDICO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Sugestão de protocolo clínico (Gemini)' })
  suggestProtocol(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.suggestProtocol(user.tenantId, user.sub, payload);
  }

  @Post('glucose-analysis')
  @Roles('MEDICO', 'RECEPCAO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Análise de curva glicêmica (Gemini)' })
  glucoseAnalysis(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.analyzeGlucose(user.tenantId, user.sub, payload);
  }

  @Post('nutrition-analysis')
  @Roles('MEDICO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Análise nutricional e composição corporal (Gemini)' })
  nutritionAnalysis(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.analyzeNutrition(user.tenantId, user.sub, payload);
  }

  @Post('prescription-check')
  @Roles('MEDICO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verificação de interações medicamentosas (Gemini)' })
  prescriptionCheck(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.aiService.checkPrescription(user.tenantId, user.sub, payload);
  }
}

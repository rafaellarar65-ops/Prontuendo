import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AiService } from './ai.service';

class AssistConsultationDto {
  @IsString()
  patientId!: string;

  @IsObject()
  soap!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

class AssistRequestDto {
  @IsIn(['assist-consultation', 'analyze-exams', 'suggest-protocol', 'check-prescription', 'patient-evolution'])
  operation!: 'assist-consultation' | 'analyze-exams' | 'suggest-protocol' | 'check-prescription' | 'patient-evolution';

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('assist')
  @Roles('MEDICO', 'RECEPCAO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Endpoint unificado de assistência clínica por operação (Gemini)' })
  assist(@CurrentUser() user: AuthUser, @Body() request: AssistRequestDto) {
    const payload = request.patientId ? { ...request.payload, patientId: request.patientId } : request.payload;

    switch (request.operation) {
      case 'assist-consultation':
        return this.aiService.assistConsultation(user.tenantId, user.sub, payload);
      case 'analyze-exams':
        if (payload.examType === 'bioimpedance') {
          return this.aiService.extractBioimpedance(user.tenantId, user.sub, payload);
        }
        return this.aiService.extractLab(user.tenantId, user.sub, payload);
      case 'suggest-protocol':
        return this.aiService.suggestProtocol(user.tenantId, user.sub, payload);
      case 'check-prescription':
        return this.aiService.checkPrescription(user.tenantId, user.sub, payload);
      case 'patient-evolution':
        return this.aiService.analyzePatientEvolution(user.tenantId, user.sub, payload);
    }
  }

  @Post('assist-consultation')
  @Roles('MEDICO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Assistente clínico durante consulta (Gemini)' })
  assistConsultation(@CurrentUser() user: AuthUser, @Body() payload: AssistConsultationDto) {
    return this.aiService.assistConsultation(user.tenantId, user.sub, {
      patientId: payload.patientId,
      soap: payload.soap,
      ...(payload.payload ?? {}),
    });
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

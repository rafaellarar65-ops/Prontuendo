import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

import { PrismaService } from '../prisma/prisma.service';

import { ClinicalContextService } from './clinical-context.service';
import { consultationAssistantPrompt } from './prompts/consultation-assistant';
import { labExtractionPrompt } from './prompts/lab-extraction';
import { bioimpedanceExtractionPrompt } from './prompts/bioimpedance-extraction';
import { glucometerOcrPrompt } from './prompts/glucometer-ocr';
import { patientEvolutionPrompt } from './prompts/patient-evolution';
import { protocolConsensusPrompt } from './prompts/protocol-consensus';

const MODEL = 'gemini-2.5-flash';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly clinicalContextService: ClinicalContextService,
  ) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY não configurada — agentes IA desativados.');
    }
  }

  private getModel(systemInstruction: string): GenerativeModel {
    if (!this.genAI) throw new Error('Gemini API Key não configurada.');
    return this.genAI.getGenerativeModel({ model: MODEL, systemInstruction });
  }

  private async callGemini(systemPrompt: string, userContent: string): Promise<unknown> {
    const model = this.getModel(systemPrompt);
    const result = await model.generateContent(userContent);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return { raw: text };
    }
  }

  private async logAndCall(
    operation: string,
    tenantId: string,
    actorId: string,
    payload: Record<string, unknown>,
    systemPrompt: string,
    userContent: string,
  ) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action: 'AI_CALL', resource: operation, metadata: { ...payload } as any },
    });

    return this.callGemini(systemPrompt, userContent);
  }


  private async withClinicalContext(
    tenantId: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    if (typeof payload.patientId !== 'string' || !payload.patientId) {
      return payload;
    }

    const context = await this.clinicalContextService.buildContext(tenantId, payload.patientId);
    return {
      ...payload,
      clinicalContext: context,
    };
  }

  // 1. Assistente de Consulta
  async assistConsultation(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const enrichedPayload = await this.withClinicalContext(tenantId, payload);
    const userContent = JSON.stringify(enrichedPayload);
    return this.logAndCall('assist-consultation', tenantId, actorId, enrichedPayload, consultationAssistantPrompt, userContent);
  }

  // 2. Extração de Exames Laboratoriais
  async extractLab(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const userContent = typeof payload.text === 'string' ? payload.text : JSON.stringify(payload);
    return this.logAndCall('extract-lab', tenantId, actorId, payload, labExtractionPrompt, userContent);
  }

  // 3. Extração de Bioimpedância
  async extractBioimpedance(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const userContent = typeof payload.text === 'string' ? payload.text : JSON.stringify(payload);
    return this.logAndCall('extract-bioimpedance', tenantId, actorId, payload, bioimpedanceExtractionPrompt, userContent);
  }

  // 4. OCR de Glicosímetro
  async readGlucometer(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const userContent = typeof payload.text === 'string' ? payload.text : JSON.stringify(payload);
    return this.logAndCall('read-glucometer', tenantId, actorId, payload, glucometerOcrPrompt, userContent);
  }

  // 5. Evolução do Paciente
  async analyzePatientEvolution(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const enrichedPayload = await this.withClinicalContext(tenantId, payload);
    const userContent = JSON.stringify(enrichedPayload);
    return this.logAndCall('patient-evolution', tenantId, actorId, enrichedPayload, patientEvolutionPrompt, userContent);
  }

  // 6. Consenso de Protocolo
  async suggestProtocol(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const enrichedPayload = await this.withClinicalContext(tenantId, payload);
    const userContent = JSON.stringify(enrichedPayload);
    return this.logAndCall('suggest-protocol', tenantId, actorId, enrichedPayload, protocolConsensusPrompt, userContent);
  }

  // 7. Análise de Glicemia
  async analyzeGlucose(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const systemPrompt = `Você é especialista em análise de glicemia para endocrinologia. Analise os dados de glicemia fornecidos e retorne JSON com: {"assistantType":"glucose_analysis","summary":"string","patterns":[],"alerts":[],"hba1cEstimate":"string|null","recommendations":[],"safety":{"medicalSupervisionRequired":true,"disclaimer":"string"}}. Responda APENAS com JSON válido.`;
    const userContent = JSON.stringify(payload);
    return this.logAndCall('glucose-analysis', tenantId, actorId, payload, systemPrompt, userContent);
  }

  // 8. Análise Nutricional
  async analyzeNutrition(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const systemPrompt = `Você é nutricionista clínico especializado em endocrinologia. Analise os dados fornecidos (peso, composição corporal, bioimpedância) e retorne JSON com: {"assistantType":"nutrition_analysis","bmiCategory":"string","bodyCompositionSummary":"string","nutritionalAlerts":[],"generalGuidelines":[],"followUpSuggestions":[],"safety":{"medicalSupervisionRequired":true,"disclaimer":"string"}}. Responda APENAS com JSON válido.`;
    const userContent = JSON.stringify(payload);
    return this.logAndCall('nutrition-analysis', tenantId, actorId, payload, systemPrompt, userContent);
  }

  // 9. Verificação de Prescrição (segurança)
  async checkPrescription(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    const systemPrompt = `Você é farmacêutico clínico especialista em endocrinologia. Verifique a prescrição fornecida quanto a interações medicamentosas, contraindicações e alertas de segurança. Retorne JSON: {"assistantType":"prescription_check","medications":[],"interactions":[],"contraindications":[],"alerts":[],"overallRisk":"low|medium|high","safety":{"isDefinitivePrescription":false,"medicalSupervisionRequired":true,"disclaimer":"Verificação de apoio. Decisão final exclusivamente do médico."}}. Responda APENAS com JSON válido.`;
    const enrichedPayload = await this.withClinicalContext(tenantId, payload);
    const userContent = JSON.stringify(enrichedPayload);
    return this.logAndCall('prescription-check', tenantId, actorId, enrichedPayload, systemPrompt, userContent);
  }

  // Proxy legado
  async proxy(operation: string, tenantId: string, actorId: string, payload: Record<string, unknown>) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action: 'AI_PROXY', resource: operation, metadata: payload as any },
    });
    return { provider: 'gemini', operation, status: 'queued', tenantId };
  }
}

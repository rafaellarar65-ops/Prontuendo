import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { LAB_REPORT_ANALYZER_PROMPT } from './lab-report-prompt';

@Injectable()
export class LabResultsService {
  private genAI?: GoogleGenerativeAI;
  private readonly logger = new Logger(LabResultsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn('GEMINI_API_KEY not found');
    }
  }

  async create(tenantId: string, patientId: string, dto: CreateLabResultDto) {
    const result = await this.prisma.labResult.create({
      data: {
        tenantId,
        patientId,
        examName: dto.examName,
        value: dto.value,
        unit: dto.unit,
        reference: dto.reference,
        resultDate: new Date(dto.resultDate),
      },
    });

    return result;
  }

  findByPatient(tenantId: string, patientId: string, limit = 50) {
    return this.prisma.labResult.findMany({
      where: { tenantId, patientId },
      orderBy: { resultDate: 'desc' },
      take: limit,
    });
  }

  findLatest(tenantId: string, patientId: string) {
    return this.prisma.labResult.findFirst({
      where: { tenantId, patientId },
      orderBy: { resultDate: 'desc' },
    });
  }

  async extract(tenantId: string, actorId: string, payload: Record<string, unknown>) {
    await this.prisma.activityLog.create({
      data: { tenantId, actorId, action: 'EXTRACT_REQUEST', resource: 'lab-results', metadata: payload as any },
    });
    return { status: 'queued', source: 'ia', entity: 'lab-results' };
  }

  async analyze(file: Express.Multer.File) {
    if (!this.genAI) {
      throw new Error('AI Service not configured');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const imagePart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype,
      },
    };

    const result = await model.generateContent([
      LAB_REPORT_ANALYZER_PROMPT,
      imagePart,
    ]);

    const response = result.response;
    const text = response.text();
    
    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (error) {
      this.logger.error('Failed to parse AI response', error);
      throw new Error('Failed to parse AI analysis result');
    }
  }
}

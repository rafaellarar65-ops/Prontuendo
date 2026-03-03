import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

type ResolverContext = {
  patientId: string;
  consultationId?: string;
  clinicianId?: string;
};

type ResolveOptions = {
  fallbackValue?: string;
};

type FabricObject = {
  text?: string;
  objects?: FabricObject[];
  [key: string]: unknown;
};

type FabricCanvasJson = {
  objects?: FabricObject[];
  [key: string]: unknown;
};

type NamespaceValues = Record<string, Record<string, string>>;

@Injectable()
export class VariableResolverService {
  private static readonly PLACEHOLDER_REGEX = /{{\s*([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*}}/g;

  constructor(private readonly prisma: PrismaService) {}

  async resolveForPreview(templateId: string, tenantId: string, context: ResolverContext, options?: ResolveOptions) {
    return this.resolveTemplateCanvas(templateId, tenantId, context, options);
  }

  async resolveForPdf(templateId: string, tenantId: string, context: ResolverContext, options?: ResolveOptions) {
    return this.resolveTemplateCanvas(templateId, tenantId, context, options);
  }

  async resolveTemplateCanvas(templateId: string, tenantId: string, context: ResolverContext, options?: ResolveOptions) {
    const documentTemplate = await this.findTemplateById(templateId, tenantId);

    if (!documentTemplate) {
      throw new NotFoundException('Template não encontrado');
    }

    const canvasJson = this.parseCanvasJson(documentTemplate.canvasJson);
    const namespaces = await this.buildNamespaceValues(tenantId, context);

    return this.resolveCanvasJson(canvasJson, namespaces, options?.fallbackValue ?? '');
  }

  resolveCanvasJson(canvasJson: FabricCanvasJson, namespaces: NamespaceValues, fallbackValue = ''): FabricCanvasJson {
    const cloned = structuredClone(canvasJson);

    const walk = (objects?: FabricObject[]) => {
      if (!Array.isArray(objects)) {
        return;
      }

      for (const object of objects) {
        if (typeof object.text === 'string') {
          object.text = this.replacePlaceholders(object.text, namespaces, fallbackValue);
        }

        if (Array.isArray(object.objects)) {
          walk(object.objects);
        }
      }
    };

    walk(cloned.objects);
    return cloned;
  }

  replacePlaceholders(input: string, namespaces: NamespaceValues, fallbackValue = ''): string {
    return input.replace(VariableResolverService.PLACEHOLDER_REGEX, (_, namespaceRaw: string, keyRaw: string) => {
      const namespace = namespaceRaw.toLowerCase();
      const key = keyRaw;
      const value = namespaces[namespace]?.[key];
      return value ?? fallbackValue;
    });
  }

  private async findTemplateById(templateId: string, tenantId: string): Promise<{ canvasJson: unknown } | null> {
    const prismaDynamic = this.prisma as unknown as Record<string, any>;
    const model = prismaDynamic.documentTemplate;

    if (!model || typeof model.findFirst !== 'function') {
      return null;
    }

    return model.findFirst({
      where: { id: templateId, tenantId },
      select: { canvasJson: true },
    });
  }

  private parseCanvasJson(value: unknown): FabricCanvasJson {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as FabricCanvasJson;
      } catch {
        return { objects: [] };
      }
    }

    if (value && typeof value === 'object') {
      return value as FabricCanvasJson;
    }

    return { objects: [] };
  }

  private async buildNamespaceValues(tenantId: string, context: ResolverContext): Promise<NamespaceValues> {
    const now = new Date();

    const [patient, consultation, clinician, clinic, latestBio, glucose30d, glucose7d, latestGlucose] = await Promise.all([
      this.prisma.patient.findFirst({
        where: { id: context.patientId, tenantId },
      }),
      context.consultationId
        ? this.prisma.consultation.findFirst({
            where: { id: context.consultationId, tenantId },
          })
        : Promise.resolve(null),
      this.resolveClinician(tenantId, context),
      this.prisma.tenant.findFirst({
        where: { id: tenantId },
      }),
      this.prisma.bioimpedanceExam.findFirst({
        where: { tenantId, patientId: context.patientId },
        orderBy: { measuredAt: 'desc' },
      }),
      this.prisma.glucoseLog.findMany({
        where: {
          tenantId,
          patientId: context.patientId,
          measuredAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { measuredAt: 'desc' },
      }),
      this.prisma.glucoseLog.findMany({
        where: {
          tenantId,
          patientId: context.patientId,
          measuredAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.glucoseLog.findFirst({
        where: { tenantId, patientId: context.patientId },
        orderBy: { measuredAt: 'desc' },
      }),
    ]);

    const glucoseAvg30 = this.average(glucose30d.map((item) => item.value));
    const glucoseAvg7 = this.average(glucose7d.map((item) => item.value));
    const tir = glucose30d.length
      ? (glucose30d.filter((item) => item.value >= 70 && item.value <= 180).length / glucose30d.length) * 100
      : null;
    const estimatedHba1c = glucoseAvg30 !== null ? (glucoseAvg30 + 46.7) / 28.7 : null;

    return {
      paciente: {
        nome: patient?.fullName ?? '',
        cpf: patient?.cpf ?? '',
        dataNascimento: this.formatDate(patient?.birthDate),
        idade: this.calculateAge(patient?.birthDate),
        sexo: patient?.sex ?? '',
        telefone: patient?.phone ?? '',
        email: patient?.email ?? '',
      },
      bio: {
        data: this.formatDate(latestBio?.measuredAt),
        pesoKg: this.formatNumber(latestBio?.weightKg),
        gorduraCorporalPct: this.formatNumber(latestBio?.bodyFatPct),
        massaMagraKg: this.formatNumber(latestBio?.muscleMassKg),
      },
      glicemia: {
        media7d: this.formatNumber(glucoseAvg7),
        media30d: this.formatNumber(glucoseAvg30),
        ultimaLeitura: latestGlucose?.value?.toString() ?? '',
        ultimaLeituraData: this.formatDateTime(latestGlucose?.measuredAt),
        estimativaHbA1c: this.formatNumber(estimatedHba1c),
        timeInRange: tir !== null ? `${tir.toFixed(1)}%` : '',
      },
      medico: {
        nome: clinician?.fullName ?? '',
        email: clinician?.email ?? '',
        id: clinician?.id ?? '',
      },
      consulta: {
        id: consultation?.id ?? '',
        status: consultation?.status ?? '',
        criadaEm: this.formatDateTime(consultation?.createdAt),
        finalizadaEm: this.formatDateTime(consultation?.finalizedAt),
        atualizadaEm: this.formatDateTime(consultation?.updatedAt),
      },
      data: {
        hoje: this.formatDate(now),
        hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        dia: String(now.getDate()).padStart(2, '0'),
        mes: String(now.getMonth() + 1).padStart(2, '0'),
        ano: String(now.getFullYear()),
      },
      clinica: {
        id: clinic?.id ?? '',
        nome: clinic?.name ?? '',
      },
      exames: await this.resolveExamValues(tenantId, context.patientId),
    };
  }

  private async resolveExamValues(tenantId: string, patientId: string): Promise<Record<string, string>> {
    const latestByExam = await this.prisma.labResult.findMany({
      where: { tenantId, patientId },
      orderBy: [{ examName: 'asc' }, { resultDate: 'desc' }],
    });

    const result: Record<string, string> = {};
    const seen = new Set<string>();

    for (const exam of latestByExam) {
      const normalizedName = this.normalizeExamKey(exam.examName);
      if (seen.has(normalizedName)) {
        continue;
      }

      seen.add(normalizedName);
      result[`ultimo_${normalizedName}`] = `${exam.value}${exam.unit ? ` ${exam.unit}` : ''}`;
    }

    return result;
  }

  private async resolveClinician(tenantId: string, context: ResolverContext) {
    const sourceId = context.clinicianId ?? (await this.findConsultationClinicianId(tenantId, context.consultationId));

    if (!sourceId) {
      return null;
    }

    return this.prisma.user.findFirst({ where: { id: sourceId, tenantId } });
  }

  private async findConsultationClinicianId(tenantId: string, consultationId?: string): Promise<string | null> {
    if (!consultationId) {
      return null;
    }

    const consultation = await this.prisma.consultation.findFirst({
      where: { id: consultationId, tenantId },
      select: { clinicianId: true },
    });

    return consultation?.clinicianId ?? null;
  }

  private average(values: number[]): number | null {
    if (!values.length) {
      return null;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private formatDate(value?: Date | null): string {
    if (!value) {
      return '';
    }

    return value.toLocaleDateString('pt-BR');
  }

  private formatDateTime(value?: Date | null): string {
    if (!value) {
      return '';
    }

    return `${value.toLocaleDateString('pt-BR')} ${value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  private calculateAge(value?: Date | null): string {
    if (!value) {
      return '';
    }

    const now = new Date();
    let age = now.getFullYear() - value.getFullYear();
    const monthDiff = now.getMonth() - value.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < value.getDate())) {
      age -= 1;
    }

    return String(age);
  }

  private formatNumber(value?: number | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }

    return Number(value).toFixed(2);
  }

  private normalizeExamKey(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}

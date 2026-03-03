import { promises as fs } from 'fs';
import { join, posix } from 'path';

import { Injectable } from '@nestjs/common';

@Injectable()
export class SoapPdfService {
  private escapeText(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  private buildPdfBuffer(lines: string[]): Buffer {
    const safeLines = lines.length > 0 ? lines : ['Resumo SOAP indisponível'];
    const content = ['BT', '/F1 11 Tf', '50 790 Td']
      .concat(
        safeLines.flatMap((line, index) => {
          const ops = [`(${this.escapeText(line)}) Tj`];
          if (index < safeLines.length - 1) {
            ops.push('0 -14 Td');
          }
          return ops;
        }),
      )
      .concat(['ET'])
      .join('\n');

    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
      `5 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream\nendobj`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];
    for (const object of objects) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${object}\n`;
    }

    const xrefStart = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i += 1) {
      pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }

  private normalizeDraftValue(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim() || 'Não informado';
    }

    if (value === null || value === undefined) {
      return 'Não informado';
    }

    return JSON.stringify(value, null, 2);
  }

  async createSoapSummaryPdf(params: {
    tenantId: string;
    patientId: string;
    consultationId: string;
    latestDraft: Record<string, unknown>;
  }) {
    const { tenantId, patientId, consultationId, latestDraft } = params;

    const soap = {
      subjective: this.normalizeDraftValue(latestDraft.subjective),
      objective: this.normalizeDraftValue(latestDraft.objective),
      assessment: this.normalizeDraftValue(latestDraft.assessment),
      plan: this.normalizeDraftValue(latestDraft.plan),
    };

    const lines = [
      `Consulta: ${consultationId}`,
      `Emitido em: ${new Date().toISOString()}`,
      '',
      'S - Subjective',
      soap.subjective,
      '',
      'O - Objective',
      soap.objective,
      '',
      'A - Assessment',
      soap.assessment,
      '',
      'P - Plan',
      soap.plan,
    ];

    const buffer = this.buildPdfBuffer(lines);
    const timestamp = Date.now();
    const fileName = `soap_${consultationId}_${timestamp}.pdf`;
    const storageKey = posix.join(tenantId, patientId, fileName);
    const outputPath = join(process.cwd(), 'uploads', storageKey);

    await fs.mkdir(join(process.cwd(), 'uploads', tenantId, patientId), { recursive: true });
    await fs.writeFile(outputPath, buffer);

    return {
      fileName,
      storageKey,
      mimeType: 'application/pdf',
      fileSize: buffer.byteLength,
    };
  }
}

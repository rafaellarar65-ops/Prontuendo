import { Injectable, NotFoundException } from '@nestjs/common';

import { RenderTemplateDto } from '../templates/dto/render-template.dto';

@Injectable()
export class VariableResolverService {
  resolveCanvas(canvasJson: Record<string, unknown>, context: RenderTemplateDto) {
    const serialized = JSON.stringify(canvasJson);
    const placeholders = new Set(serialized.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) ?? []);

    let resolved = serialized;
    const values: Record<string, string | undefined> = {
      patientId: context.patientId,
      consultationId: context.consultationId,
      clinicianId: context.clinicianId,
    };

    for (const placeholder of placeholders) {
      const variableName = placeholder.replace(/{{\s*|\s*}}/g, '');
      const value = values[variableName];

      if (!value) {
        throw new NotFoundException(`Dados de contexto inválidos: ${variableName} não resolvido`);
      }

      resolved = resolved.replaceAll(placeholder, value);
    }

    return JSON.parse(resolved) as Record<string, unknown>;
  }
}

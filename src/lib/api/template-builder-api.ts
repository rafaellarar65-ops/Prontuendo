import type { BuilderElement, BuilderVariable } from '@/types/template-builder';

const elements: BuilderElement[] = [
  { id: 'e1', label: 'Texto Livre', type: 'text' },
  { id: 'e2', label: 'Campo Variável', type: 'field' },
  { id: 'e3', label: 'Mini Gráfico', type: 'chart' },
];

const variables: BuilderVariable[] = [
  { id: 'v1', token: '{{patient.name}}', description: 'Nome do paciente' },
  { id: 'v2', token: '{{consultation.date}}', description: 'Data da consulta' },
  { id: 'v3', token: '{{lab.hba1c.last}}', description: 'Último HbA1c' },
];

export const templateBuilderApi = {
  async listElements(): Promise<BuilderElement[]> {
    return Promise.resolve(elements);
  },
  async listVariables(): Promise<BuilderVariable[]> {
    return Promise.resolve(variables);
  },
};

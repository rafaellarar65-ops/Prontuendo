import type { ConsultationTemplate } from '@/types/domain';

const mockTemplates: ConsultationTemplate[] = [
  { id: 'soap-standard', name: 'SOAP Padrão Endócrino', category: 'SOAP', canvasJson: {}, isDefault: true },
  { id: 'retorno-diabetes', name: 'Retorno Diabetes', category: 'RETORNO', canvasJson: {}, isDefault: false },
  {
    id: 'primeira-consulta-obesidade',
    name: 'Primeira Consulta Obesidade',
    category: 'PRIMEIRA_CONSULTA',
    canvasJson: {},
    isDefault: false,
  },
];

export const templateApi = {
  async listConsultationTemplates(): Promise<ConsultationTemplate[]> {
    return Promise.resolve(mockTemplates);
  },
};

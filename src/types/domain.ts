export type PatientProfileTab =
  | 'dados'
  | 'consultas'
  | 'bioimpedancia'
  | 'exames'
  | 'glicemia'
  | 'documentos'
  | 'plano';

export interface ConsultationTemplate {
  id: string;
  name: string;
  category: 'SOAP' | 'RETORNO' | 'PRIMEIRA_CONSULTA' | 'NUTRICAO';
  isDefault: boolean;
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
}

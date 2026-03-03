export type TemplateCategory = 'SOAP' | 'RETORNO' | 'PRIMEIRA_CONSULTA' | 'NUTRICAO' | 'PERSONALIZADO';

export interface TemplateRecord {
  id: string;
  name?: string;
  category?: TemplateCategory;
  canvasJson?: object;
  payload?: {
    name?: string;
    canvas?: object;
  };
  createdAt?: string;
  updatedAt?: string;
}

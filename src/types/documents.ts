export type DocumentCategory =
  | 'EXAME'
  | 'RECEITA'
  | 'ATESTADO'
  | 'RELATORIO'
  | 'OUTRO';

export interface Document {
  id: string;
  tenantId: string;
  patientId: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  description?: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentDto {
  file: File;
  patientId: string;
  category: DocumentCategory;
  description?: string;
}

import { http } from '@/lib/api/http';

export interface PatientDocument {
  id: string;
  patientId: string;
  fileName: string;
  mimeType?: string | null;
  category?: string | null;
  description?: string | null;
  isFromPortal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentDto {
  patientId: string;
  file: File;
  category: string;
  description?: string;
}

export const documentsApi = {
  async list(patientId: string, category?: string): Promise<PatientDocument[]> {
    const { data } = await http.get<PatientDocument[]>('/documents', {
      params: {
        patientId,
        ...(category ? { category } : {}),
      },
    });

    return data;
  },

  async upload(dto: UploadDocumentDto): Promise<PatientDocument> {
    const formData = new FormData();
    formData.append('patientId', dto.patientId);
    formData.append('file', dto.file);
    formData.append('category', dto.category);

    if (dto.description) {
      formData.append('description', dto.description);
    }

    const { data } = await http.post<PatientDocument>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },

  async download(id: string): Promise<Blob> {
    const { data } = await http.get<Blob>(`/documents/${id}/download`, {
      responseType: 'blob',
    });

    return data;
  },
};

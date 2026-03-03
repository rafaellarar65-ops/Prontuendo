import { http } from '@/lib/api/http';
import type { Document, DocumentCategory, UploadDocumentDto } from '@/types/documents';

interface ListPatientDocumentsFilters {
  category?: DocumentCategory;
  sharedWithPatient?: boolean;
}

export const documentsApi = {
  async listByPatient(
    patientId: string,
    categoryOrFilters?: DocumentCategory | ListPatientDocumentsFilters,
  ): Promise<Document[]> {
    const filters =
      typeof categoryOrFilters === "string" ? { category: categoryOrFilters } : categoryOrFilters;

    const { data } = await http.get<Document[]>('/documents', {
      params: {
        patientId,
        ...(filters?.category ? { category: filters.category } : {}),
        ...(filters?.sharedWithPatient !== undefined ? { sharedWithPatient: filters.sharedWithPatient } : {}),
      },
    });
    return data;
  },

  async upload(dto: UploadDocumentDto): Promise<Document> {
    const formData = new FormData();
    formData.append('file', dto.file);
    formData.append('patientId', dto.patientId);
    formData.append('category', dto.category);
    formData.append('isFromPortal', String(dto.isFromPortal ?? false));
    if (dto.description) {
      formData.append('description', dto.description);
    }

    const { data } = await http.post<Document>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getById(id: string): Promise<Document> {
    const { data } = await http.get<Document>(`/documents/${id}`);
    return data;
  },

  async download(id: string): Promise<Blob> {
    const { data } = await http.get<Blob>(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/documents/${id}`);
  },
};

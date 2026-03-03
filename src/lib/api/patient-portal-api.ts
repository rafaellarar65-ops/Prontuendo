import { http } from '@/lib/api/http';

export interface PatientPortalDocument {
  id: string;
  name: string;
  fileUrl: string;
  date: string;
  isFromPortal?: boolean;
  sharedWithPatient?: boolean;
}

interface ActivityLogLike {
  id: string;
  createdAt: string;
  metadata?: {
    name?: string;
    fileUrl?: string;
    isFromPortal?: boolean;
    sharedWithPatient?: boolean;
  };
}

const mapToPatientPortalDocument = (item: ActivityLogLike): PatientPortalDocument => {
  const document: PatientPortalDocument = {
    id: item.id,
    name: item.metadata?.name ?? 'Documento sem nome',
    fileUrl: item.metadata?.fileUrl ?? '#',
    date: item.createdAt,
  };

  if (item.metadata?.isFromPortal !== undefined) {
    document.isFromPortal = item.metadata.isFromPortal;
  }

  if (item.metadata?.sharedWithPatient !== undefined) {
    document.sharedWithPatient = item.metadata.sharedWithPatient;
  }

  return document;
};

export const patientPortalApi = {
  async listDocuments(patientId: string): Promise<PatientPortalDocument[]> {
    const { data } = await http.get<ActivityLogLike[]>(`/patient-portal/${patientId}/documents`);
    return data.map(mapToPatientPortalDocument);
  },

  async uploadExam(patientId: string, file: File): Promise<PatientPortalDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isFromPortal', 'true');

    const { data } = await http.post<PatientPortalDocument>(`/patient-portal/${patientId}/upload-exam`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
  },
};

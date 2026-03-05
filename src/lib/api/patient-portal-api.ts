import { documentsApi } from '@/lib/api/documents-api';
import type { Document } from '@/types/documents';

/**
 * @deprecated Prefer using domain APIs directly (e.g. documentsApi) to avoid contract duplication.
 */
export const patientPortalApi = {
  listDocuments: (patientId: string): Promise<Document[]> =>
    documentsApi.listByPatient(patientId, { sharedWithPatient: true }),
};

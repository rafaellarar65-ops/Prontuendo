import { http } from '@/lib/api/http';
import type { Patient } from '@/types/api';

export const patientApi = {
  async list(): Promise<Patient[]> {
    const { data } = await http.get<Patient[]>('/patients');
    return data;
  },
  async detail(id: string): Promise<Patient> {
    const { data } = await http.get<Patient>(`/patients/${id}`);
    return data;
  },
};

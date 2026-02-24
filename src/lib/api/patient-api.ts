import { http } from '@/lib/api/http';
import type { CreatePatientDto, Patient, UpdatePatientDto } from '@/types/api';

export const patientApi = {
  async list(): Promise<Patient[]> {
    const { data } = await http.get<Patient[]>('/patients');
    return data;
  },
  async detail(id: string): Promise<Patient> {
    const { data } = await http.get<Patient>(`/patients/${id}`);
    return data;
  },
  async create(dto: CreatePatientDto): Promise<Patient> {
    const { data } = await http.post<Patient>('/patients', dto);
    return data;
  },
  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const { data } = await http.put<Patient>(`/patients/${id}`, dto);
    return data;
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/patients/${id}`);
  },
};

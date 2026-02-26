import { http } from '@/lib/api/http';
import type { ClinicPayload, ModuleRecord } from '@/types/clinical-modules';

export const clinicsApi = {
  async list(): Promise<Array<ModuleRecord<ClinicPayload>>> {
    const { data } = await http.get<Array<ModuleRecord<ClinicPayload>>>('/clinics');
    return data;
  },
  async create(payload: ClinicPayload): Promise<ModuleRecord<ClinicPayload>> {
    const { data } = await http.post<ModuleRecord<ClinicPayload>>('/clinics', { payload });
    return data;
  },
  async update(id: string, payload: Partial<ClinicPayload>): Promise<ModuleRecord<ClinicPayload> | null> {
    const { data } = await http.patch<ModuleRecord<ClinicPayload> | null>(`/clinics/${id}`, { payload });
    return data;
  },
};

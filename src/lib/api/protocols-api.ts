import { http } from '@/lib/api/http';
import type { ModuleRecord, ProtocolPayload } from '@/types/clinical-modules';

export const protocolsApi = {
  async list(): Promise<Array<ModuleRecord<ProtocolPayload>>> {
    const { data } = await http.get<Array<ModuleRecord<ProtocolPayload>>>('/protocols');
    return data;
  },
  async create(payload: ProtocolPayload): Promise<ModuleRecord<ProtocolPayload>> {
    const { data } = await http.post<ModuleRecord<ProtocolPayload>>('/protocols', { payload });
    return data;
  },
  async update(id: string, payload: Partial<ProtocolPayload>): Promise<ModuleRecord<ProtocolPayload> | null> {
    const { data } = await http.patch<ModuleRecord<ProtocolPayload> | null>(`/protocols/${id}`, { payload });
    return data;
  },
};

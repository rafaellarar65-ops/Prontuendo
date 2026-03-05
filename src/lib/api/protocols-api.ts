import { http } from '@/lib/api/http';
import type { ModuleRecord, ProtocolPayload } from '@/types/clinical-modules';

export interface ProtocolListParams {
  condition?: string;
  status?: string;
}

export const protocolsApi = {
  async list(params?: ProtocolListParams): Promise<Array<ModuleRecord<ProtocolPayload>>> {
    const { data } = await http.get<Array<ModuleRecord<ProtocolPayload>>>('/protocols', {
      params,
    });
    return data;
  },
  async getById(id: string): Promise<ModuleRecord<ProtocolPayload> | null> {
    const { data } = await http.get<ModuleRecord<ProtocolPayload> | null>(`/protocols/${id}`);
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
  async activate(id: string): Promise<ModuleRecord<ProtocolPayload> | null> {
    const { data } = await http.post<ModuleRecord<ProtocolPayload> | null>(`/protocols/${id}/activate`);
    return data;
  },
  async deactivate(id: string): Promise<ModuleRecord<ProtocolPayload> | null> {
    const { data } = await http.post<ModuleRecord<ProtocolPayload> | null>(`/protocols/${id}/deactivate`);
    return data;
  },
  async suggestForDiagnosis(diagnosisCodes: string[]): Promise<Array<ModuleRecord<ProtocolPayload>>> {
    const condition = diagnosisCodes.join(',');
    return this.list({ condition });
  },
};

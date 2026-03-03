import { http } from '@/lib/api/http';
import type { Appointment, CreateAppointmentDto } from '@/types/api';

export const appointmentsApi = {
  async list(params?: { date?: string; from?: string; to?: string }): Promise<Appointment[]> {
    const queryParams = params?.date
      ? { date: params.date }
      : params?.from && params?.to
        ? { from: params.from, to: params.to }
        : undefined;
    const { data } = await http.get<Appointment[]>('/agenda', {
      params: queryParams,
    });
    return data;
  },
  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const { data } = await http.post<Appointment>('/agenda', { payload: dto });
    return data;
  },
  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    const { data } = await http.patch<Appointment>(`/agenda/${id}`, {
      payload: { status },
    });
    return data;
  },
  async cancel(id: string): Promise<Appointment> {
    return this.updateStatus(id, 'CANCELADO');
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/agenda/${id}`);
  },
};

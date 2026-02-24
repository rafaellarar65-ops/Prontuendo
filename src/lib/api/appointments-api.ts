import { http } from '@/lib/api/http';
import type { Appointment, CreateAppointmentDto } from '@/types/api';

export const appointmentsApi = {
  async list(date?: string): Promise<Appointment[]> {
    const { data } = await http.get<Appointment[]>('/appointments', {
      params: date ? { date } : undefined,
    });
    return data;
  },
  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const { data } = await http.post<Appointment>('/appointments', dto);
    return data;
  },
  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    const { data } = await http.patch<Appointment>(`/appointments/${id}/status`, { status });
    return data;
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/appointments/${id}`);
  },
};

import { http } from '@/lib/api/http';
import type { Appointment, CreateAppointmentDto } from '@/types/api';

export const appointmentsApi = {
  async listByDate(date: string): Promise<Appointment[]> {
    const { data } = await http.get<Appointment[]>('/agenda', {
      params: { date },
    });
    return data;
  },

  async listByPatient(patientId: string): Promise<Appointment[]> {
    const { data } = await http.get<Appointment[]>('/agenda', {
      params: { patientId },
    });
    return data;
  },

  async listByRange(start: string, end: string): Promise<Appointment[]> {
    const { data } = await http.get<Appointment[]>('/agenda', {
      params: { start, end },
    });
    return data;
  },

  async availableSlots(
    clinicianId: string,
    date: string,
    durationMin?: number,
  ): Promise<string[]> {
    const { data } = await http.get<string[]>('/agenda/available-slots', {
      params: { clinicianId, date, durationMin },
    });
    return data;
  },

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const { data } = await http.post<Appointment>('/agenda', dto);
    return data;
  },

  async update(id: string, dto: Partial<CreateAppointmentDto>): Promise<Appointment> {
    const { data } = await http.patch<Appointment>(`/agenda/${id}`, dto);
    return data;
  },

  async cancel(id: string): Promise<Appointment | void> {
    const { data } = await http.patch<Appointment>(`/agenda/${id}`, {
      status: 'CANCELADO',
    });
    return data;
  },
};

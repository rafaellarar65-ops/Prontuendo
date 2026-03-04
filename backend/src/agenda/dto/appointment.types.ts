export const APPOINTMENT_TYPES = ['PRIMEIRA_CONSULTA', 'RETORNO', 'TELECONSULTA', 'EXAME'] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const APPOINTMENT_STATUS = ['AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

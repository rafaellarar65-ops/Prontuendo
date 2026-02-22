export const makeUniqueId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

export const testUsers = {
  doctor: {
    email: process.env.PW_DOCTOR_EMAIL ?? 'medico.qa@endocrino.local',
    password: process.env.PW_DOCTOR_PASSWORD ?? 'Medico@123!',
    role: 'MEDICO',
  },
  patient: {
    email: process.env.PW_PATIENT_EMAIL ?? 'paciente.qa@endocrino.local',
    password: process.env.PW_PATIENT_PASSWORD ?? 'Paciente@123!',
    role: 'PACIENTE',
  },
  receptionist: {
    email: process.env.PW_RECEPTIONIST_EMAIL ?? 'recepcao.qa@endocrino.local',
    password: process.env.PW_RECEPTIONIST_PASSWORD ?? 'Recepcao@123!',
    role: 'RECEPCAO',
  },
};

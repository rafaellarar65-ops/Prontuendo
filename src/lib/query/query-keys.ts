export const queryKeys = {
  authUser: ['auth', 'user'] as const,
  patients: ['patients'] as const,
  patientDetail: (patientId: string) => ['patients', patientId] as const,
  consultations: ['consultations'] as const,
  consultationById: (consultationId: string) => ['consultations', consultationId] as const,
  consultationTemplates: ['consultation-templates'] as const,
  appointments: ['appointments'] as const,
  appointmentsByDate: (date: string) => ['appointments', date] as const,
  bioimpedancePreview: ['bioimpedance', 'preview'] as const,
  bioimpedanceEvolution: ['bioimpedance', 'evolution'] as const,
  templateBuilderElements: ['template-builder', 'elements'] as const,
  templateBuilderVariables: ['template-builder', 'variables'] as const,
  clinics: ['clinics'] as const,
  scores: ['scores'] as const,
  protocols: ['protocols'] as const,
  labResultsHistory: (patientId: string, examName?: string) =>
    ['lab-results', patientId, examName ?? 'all'] as const,
};

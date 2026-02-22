export const queryKeys = {
  authUser: ['auth', 'user'] as const,
  patients: ['patients'] as const,
  patientDetail: (patientId: string) => ['patients', patientId] as const,
  consultations: ['consultations'] as const,
  consultationTemplates: ['consultation-templates'] as const,
  bioimpedancePreview: ['bioimpedance', 'preview'] as const,
  bioimpedanceEvolution: ['bioimpedance', 'evolution'] as const,
  templateBuilderElements: ['template-builder', 'elements'] as const,
  templateBuilderVariables: ['template-builder', 'variables'] as const,
};

export type GuardrailDecision = 'allow' | 'block' | 'escalate';

export interface GuardrailsConfig {
  modelRouting: {
    primary: 'gemini-2.0-flash';
    fallback: 'claude-sonnet';
    useFallbackWhen: Array<'provider_unavailable' | 'timeout' | 'low_confidence'>;
  };
  clinicalSafety: {
    forbidDefinitiveDiagnosis: boolean;
    forbidPrescription: boolean;
    mustStateAssistantRole: boolean;
    mandatoryDisclaimer: string;
  };
  hallucinationFilter: {
    enabled: boolean;
    minEvidenceItems: number;
    requireCitationForClinicalClaims: boolean;
    onViolation: GuardrailDecision;
  };
  confidencePolicy: {
    minimumGlobalConfidence: number;
    minimumFieldConfidence: number;
    onLowConfidence: GuardrailDecision;
  };
  rateLimiting: {
    windowSeconds: number;
    maxRequestsPerWindowByTenant: number;
    maxRequestsPerWindowByUser: number;
    onLimitExceeded: GuardrailDecision;
  };
  logging: {
    mandatory: true;
    includePromptName: boolean;
    includeModel: boolean;
    includeLatencyMs: boolean;
    includeTokenUsage: boolean;
    includeConfidenceScores: boolean;
    redactSensitiveData: boolean;
  };
}

export const guardrailsConfig: GuardrailsConfig = {
  modelRouting: {
    primary: 'gemini-2.0-flash',
    fallback: 'claude-sonnet',
    useFallbackWhen: ['provider_unavailable', 'timeout', 'low_confidence'],
  },
  clinicalSafety: {
    forbidDefinitiveDiagnosis: true,
    forbidPrescription: true,
    mustStateAssistantRole: true,
    mandatoryDisclaimer:
      'A IA é um assistente clínico. Não substitui avaliação médica, não fornece diagnóstico definitivo e não prescreve tratamento.',
  },
  hallucinationFilter: {
    enabled: true,
    minEvidenceItems: 2,
    requireCitationForClinicalClaims: true,
    onViolation: 'block',
  },
  confidencePolicy: {
    minimumGlobalConfidence: 0.7,
    minimumFieldConfidence: 0.6,
    onLowConfidence: 'escalate',
  },
  rateLimiting: {
    windowSeconds: 60,
    maxRequestsPerWindowByTenant: 120,
    maxRequestsPerWindowByUser: 30,
    onLimitExceeded: 'block',
  },
  logging: {
    mandatory: true,
    includePromptName: true,
    includeModel: true,
    includeLatencyMs: true,
    includeTokenUsage: true,
    includeConfidenceScores: true,
    redactSensitiveData: true,
  },
};

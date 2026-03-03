import { http } from '@/lib/api/http';

export const aiApi = {
  async assistConsultation(payload: Record<string, unknown>) {
    const patientId = typeof payload.patientId === 'string' ? payload.patientId : undefined;
    const hasSoap = typeof payload.soap === 'object' && payload.soap !== null;

    const normalizedPayload = hasSoap
      ? payload
      : {
          ...payload,
          soap: {
            subjetivo: payload.queixas,
            objetivo: payload.historico,
            avaliacao: payload.avaliacao,
            plano: payload.plano,
          },
        };

    const { data } = await http.post('/ai/assist', {
      operation: 'assist-consultation',
      patientId,
      payload: normalizedPayload,
    });
    return data;
  },
  async extractLab(text: string) {
    const { data } = await http.post('/ai/assist', {
      operation: 'analyze-exams',
      payload: { text, examType: 'lab' },
    });
    return data;
  },
  async extractBioimpedance(text: string) {
    const { data } = await http.post('/ai/assist', {
      operation: 'analyze-exams',
      payload: { text, examType: 'bioimpedance' },
    });
    return data;
  },
  async patientEvolution(payload: Record<string, unknown>) {
    const patientId = typeof payload.patientId === 'string' ? payload.patientId : undefined;
    const { data } = await http.post('/ai/assist', {
      operation: 'patient-evolution',
      patientId,
      payload,
    });
    return data;
  },
  async suggestProtocol(payload: Record<string, unknown>) {
    const patientId = typeof payload.patientId === 'string' ? payload.patientId : undefined;
    const { data } = await http.post('/ai/assist', {
      operation: 'suggest-protocol',
      patientId,
      payload,
    });
    return data;
  },
  async glucoseAnalysis(payload: Record<string, unknown>) {
    const { data } = await http.post('/ai/glucose-analysis', payload);
    return data;
  },
  async nutritionAnalysis(payload: Record<string, unknown>) {
    const { data } = await http.post('/ai/nutrition-analysis', payload);
    return data;
  },
  async prescriptionCheck(payload: Record<string, unknown>) {
    const patientId = typeof payload.patientId === 'string' ? payload.patientId : undefined;
    const { data } = await http.post('/ai/assist', {
      operation: 'check-prescription',
      patientId,
      payload,
    });
    return data;
  },
};

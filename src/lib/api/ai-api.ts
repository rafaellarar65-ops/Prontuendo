import { http } from '@/lib/api/http';

type AiOperation = 'analyze-exams' | 'suggest-protocol' | 'prescription-check' | 'patient-evolution';

type AiPatientRequest = {
  patientId: string;
};

const runPatientOperation = async (operation: AiOperation, payload: AiPatientRequest) => {
  const { data } = await http.post('/ai/proxy', {
    operation,
    payload,
  });

  return data;
};

export const aiApi = {
  async analyzeExams(patientId: string) {
    return runPatientOperation('analyze-exams', { patientId });
  },
  async suggestProtocol(patientId: string) {
    return runPatientOperation('suggest-protocol', { patientId });
  },
  async prescriptionCheck(patientId: string) {
    return runPatientOperation('prescription-check', { patientId });
  },
  async patientEvolution(patientId: string) {
    return runPatientOperation('patient-evolution', { patientId });
  },
  async extractLab(text: string) {
    const { data } = await http.post('/ai/extract-lab', { text });
    return data;
  },
  async extractBioimpedance(text: string) {
    const { data } = await http.post('/ai/proxy', {
      operation: 'extract-bioimpedance',
      payload: { text },
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
};

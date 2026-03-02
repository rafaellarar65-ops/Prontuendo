import { http } from '@/lib/api/http';

export const aiApi = {
  async assistConsultation(payload: Record<string, unknown>) {
    const { data } = await http.post('/ai/assist-consultation', payload);
    return data;
  },
  async extractLab(text: string) {
    const { data } = await http.post('/ai/extract-lab', { text });
    return data;
  },
  async extractBioimpedance(text: string) {
    const { data } = await http.post('/ai/extract-bioimpedance', { text });
    return data;
  },
  async patientEvolution(payload: Record<string, unknown>) {
    const { data } = await http.post('/ai/patient-evolution', payload);
    return data;
  },
  async suggestProtocol(payload: Record<string, unknown>) {
    const { data } = await http.post('/ai/suggest-protocol', payload);
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
    const { data } = await http.post('/ai/prescription-check', payload);
    return data;
  },
};

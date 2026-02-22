import { create } from 'zustand';

interface ConsultationState {
  activeConsultationId: string | null;
  selectedTemplateId: string | null;
  soapDraft: string;
  setActiveConsultationId: (consultationId: string | null) => void;
  setSelectedTemplateId: (templateId: string | null) => void;
  setSoapDraft: (content: string) => void;
  resetDraft: () => void;
}

export const useConsultationStore = create<ConsultationState>((set) => ({
  activeConsultationId: null,
  selectedTemplateId: null,
  soapDraft: '',
  setActiveConsultationId: (consultationId) => set({ activeConsultationId: consultationId }),
  setSelectedTemplateId: (templateId) => set({ selectedTemplateId: templateId }),
  setSoapDraft: (content) => set({ soapDraft: content }),
  resetDraft: () => set({ soapDraft: '', selectedTemplateId: null }),
}));

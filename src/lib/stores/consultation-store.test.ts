import { useConsultationStore } from '@/lib/stores/consultation-store';

describe('consultationStore', () => {
  afterEach(() => {
    useConsultationStore.getState().resetDraft();
    useConsultationStore.getState().setActiveConsultationId(null);
  });

  it('should allow selecting template for non-SOAP template flows', () => {
    useConsultationStore.getState().setSelectedTemplateId('template-retorno-endocrino');
    useConsultationStore.getState().setSoapDraft('conteúdo inicial');

    expect(useConsultationStore.getState().selectedTemplateId).toBe('template-retorno-endocrino');
    expect(useConsultationStore.getState().soapDraft).toBe('conteúdo inicial');
  });
});

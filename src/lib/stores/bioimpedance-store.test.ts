import { useBioimpedanceStore } from '@/lib/stores/bioimpedance-store';

describe('bioimpedanceStore', () => {
  afterEach(() => {
    useBioimpedanceStore.getState().resetFlow();
  });

  it('should progress flow and keep uploaded file', () => {
    useBioimpedanceStore.getState().setUploadedFileName('bioimpedancia-01.pdf');
    useBioimpedanceStore.getState().setStep('preview');

    expect(useBioimpedanceStore.getState().uploadedFileName).toBe('bioimpedancia-01.pdf');
    expect(useBioimpedanceStore.getState().currentStep).toBe('preview');
  });
});

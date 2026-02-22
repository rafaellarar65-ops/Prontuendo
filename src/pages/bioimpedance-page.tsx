import { BioimpedanceCard } from '@/components/domain/bioimpedance-card';
import { BodyVisualizer } from '@/components/domain/body-visualizer';
import { PageState } from '@/components/domain/page-state';
import {
  useConfirmBioimpedanceMutation,
  useGenerateBioimpedanceReportMutation,
  useUploadBioimpedanceMutation,
} from '@/features/bioimpedance/use-bioimpedance-actions';
import { useBioimpedanceEvolutionQuery } from '@/features/bioimpedance/use-bioimpedance-evolution-query';
import { useBioimpedancePreviewQuery } from '@/features/bioimpedance/use-bioimpedance-preview-query';
import { useBioimpedanceStore } from '@/lib/stores/bioimpedance-store';

export const BioimpedancePage = () => {
  const { currentStep, uploadedFileName, setStep, setUploadedFileName } = useBioimpedanceStore();
  const uploadMutation = useUploadBioimpedanceMutation();
  const confirmMutation = useConfirmBioimpedanceMutation();
  const reportMutation = useGenerateBioimpedanceReportMutation();
  const { data: preview, isLoading: loadingPreview, isError: errorPreview } = useBioimpedancePreviewQuery();
  const { data: evolution, isLoading: loadingEvolution, isError: errorEvolution } = useBioimpedanceEvolutionQuery();

  const handleUpload = async () => {
    const response = await uploadMutation.mutateAsync('bioimpedancia-fev-2026.pdf');
    setUploadedFileName(response.fileName);
    setStep('preview');
  };

  const handleConfirm = async () => {
    await confirmMutation.mutateAsync();
    setStep('dashboard');
  };

  const handleGenerateReport = async () => {
    await reportMutation.mutateAsync();
  };

  return (
    <main className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Bioimpedância</h1>

      {currentStep === 'upload' ? (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-medium">1) Upload</h2>
          <p className="text-sm text-muted-foreground">Envie o arquivo para iniciar a análise por IA.</p>
          <button className="mt-3 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={handleUpload} type="button">
            Simular upload
          </button>
        </section>
      ) : null}

      {currentStep === 'preview' ? (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-medium">2) Preview IA</h2>
          <p className="text-sm text-muted-foreground">Arquivo: {uploadedFileName ?? 'não informado'}</p>
          {loadingPreview ? <PageState title="Carregando" description="Gerando preview IA..." /> : null}
          {errorPreview ? <PageState title="Erro" description="Falha no preview IA." /> : null}
          {!loadingPreview && !errorPreview && preview ? (
            <div className="mt-3 space-y-3">
              <BodyVisualizer hydrationPercent={preview.hydrationPercent} fatMassPercent={preview.fatMassPercent} />
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {preview.flags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
              <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={handleConfirm} type="button">
                Confirmar leitura
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {currentStep === 'dashboard' ? (
        <section className="space-y-3 rounded-lg border bg-white p-4">
          <h2 className="font-medium">3) Dashboard + Relatório</h2>
          {loadingEvolution ? <PageState title="Carregando" description="Buscando evolução..." /> : null}
          {errorEvolution ? <PageState title="Erro" description="Falha ao carregar evolução." /> : null}
          {!loadingEvolution && !errorEvolution && evolution ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <BioimpedanceCard title="Massa magra" value={`${evolution.at(-1)?.muscleMassKg ?? 0} kg`} helper="Última leitura" />
                <BioimpedanceCard title="Gordura" value={`${evolution.at(-1)?.fatMassPercent ?? 0}%`} helper="Última leitura" />
                <BioimpedanceCard title="Sessões" value={`${evolution.length}`} helper="Medições registradas" />
              </div>
              <button className="rounded-md border px-3 py-2 text-sm" onClick={handleGenerateReport} type="button">
                Gerar relatório PDF
              </button>
              {reportMutation.data?.reportUrl ? (
                <p className="text-sm text-muted-foreground">Relatório pronto: {reportMutation.data.reportUrl}</p>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}
    </main>
  );
};

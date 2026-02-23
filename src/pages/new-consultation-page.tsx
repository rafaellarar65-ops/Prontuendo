import { useEffect } from 'react';
import { Breadcrumbs } from '@/components/app/breadcrumbs';
import { PageState } from '@/components/domain/page-state';
import { useConsultationTemplatesQuery } from '@/features/consultations/use-consultation-templates-query';
import { useConsultationStore } from '@/lib/stores/consultation-store';

export const NewConsultationPage = () => {
  const { data, isLoading, isError } = useConsultationTemplatesQuery();
  const { selectedTemplateId, setSelectedTemplateId, soapDraft, setSoapDraft } = useConsultationStore();

  useEffect(() => {
    if (!selectedTemplateId && data && data.length > 0) {
      const defaultTemplate = data.find((template) => template.isDefault) ?? data[0];
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    }
  }, [data, selectedTemplateId, setSelectedTemplateId]);

  return (
    <main className="grid gap-4 p-6 lg:grid-cols-[1fr_320px]">
      <div className="lg:col-span-2">
        <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Consultas' }, { label: 'Nova Consulta' }]} />
      </div>
      <section className="space-y-4 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Nova Consulta</h1>
          <span className="text-sm text-muted-foreground">SOAP ou templates personalizados</span>
        </div>

        {isLoading ? <PageState description="Carregando templates de consulta..." title="Carregando" /> : null}
        {isError ? <PageState description="Não foi possível obter os templates." title="Erro" /> : null}
        {!isLoading && !isError && (!data || data.length === 0) ? (
          <PageState description="Nenhum template de consulta disponível." title="Sem templates" />
        ) : null}

        {!isLoading && !isError && data && data.length > 0 ? (
          <>
            <label className="block text-sm font-medium" htmlFor="template-select">
              Modelo de consulta
            </label>
            <select
              className="w-full rounded-md border px-3 py-2"
              id="template-select"
              onChange={(event) => setSelectedTemplateId(event.target.value)}
              value={selectedTemplateId ?? ''}
            >
              {data.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium" htmlFor="soap-editor">
              Conteúdo da consulta
            </label>
            <textarea
              className="min-h-64 w-full rounded-md border p-3"
              id="soap-editor"
              onChange={(event) => setSoapDraft(event.target.value)}
              placeholder="Digite aqui o conteúdo SOAP ou baseado no template selecionado..."
              value={soapDraft}
            />
          </>
        ) : null}
      </section>

      <aside className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="text-lg font-medium">Side panel clínico</h2>
        <p className="text-sm text-muted-foreground">Dados do paciente, exames recentes e assistente IA aparecerão aqui.</p>
      </aside>
    </main>
  );
};

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumbs } from '@/components/app/breadcrumbs';
import { PageState } from '@/components/domain/page-state';
import { StatusBadge } from '@/components/domain/status-badge';
import { usePatientDetailQuery } from '@/features/patients/use-patient-detail-query';
import type { PatientProfileTab } from '@/types/domain';

const tabs: Array<{ id: PatientProfileTab; label: string }> = [
  { id: 'dados', label: 'Dados' },
  { id: 'consultas', label: 'Consultas' },
  { id: 'bioimpedancia', label: 'Bioimpedância' },
  { id: 'exames', label: 'Exames' },
  { id: 'glicemia', label: 'Glicemia' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'plano', label: 'Plano' },
];

export const PatientProfilePage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const [activeTab, setActiveTab] = useState<PatientProfileTab>('dados');
  const { data, isLoading, isError } = usePatientDetailQuery(patientId);

  const tabDescription = useMemo(() => {
    const map: Record<PatientProfileTab, string> = {
      dados: 'Dados cadastrais e informações clínicas de base.',
      consultas: 'Linha do tempo de consultas com evolução clínica.',
      bioimpedancia: 'Análises corporais e comparação evolutiva.',
      exames: 'Exames laboratoriais recentes e histórico.',
      glicemia: 'Curva glicêmica, metas e alertas.',
      documentos: 'Arquivos anexados e documentação médica.',
      plano: 'Plano terapêutico ativo e adesão.',
    };
    return map[activeTab];
  }, [activeTab]);

  return (
    <main className="space-y-4 p-6">
      <Breadcrumbs items={[{ label: 'Início', to: '/' }, { label: 'Pacientes', to: '/pacientes' }, { label: 'Perfil' }]} />
      {isLoading ? <PageState description="Carregando visão 360º do paciente..." title="Carregando" /> : null}
      {isError ? <PageState description="Não foi possível carregar o perfil." title="Erro ao carregar" /> : null}
      {!isLoading && !isError && !data ? <PageState description="Paciente não encontrado." title="Sem dados" /> : null}

      {!isLoading && !isError && data ? (
        <>
          <section className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{data.fullName}</h1>
                <p className="text-sm text-muted-foreground">Paciente ID: {data.id}</p>
              </div>
              <StatusBadge label="Visão 360º" tone="success" />
            </div>
          </section>

          <nav aria-label="Abas do perfil" className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-white'}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <section className="rounded-lg border bg-white p-4">
            <h2 className="text-lg font-medium">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{tabDescription}</p>
          </section>
        </>
      ) : null}
    </main>
  );
};

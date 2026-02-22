import { Link } from 'react-router-dom';
import { PatientCard } from '@/components/domain/patient-card';
import { PageState } from '@/components/domain/page-state';
import { usePatientsQuery } from '@/features/patients/use-patients-query';

export const PatientsListPage = () => {
  const { data, isLoading, isError } = usePatientsQuery();

  return (
    <main className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <span className="text-sm text-muted-foreground">Visão da carteira de pacientes</span>
      </div>

      {isLoading ? <PageState description="Carregando pacientes da API..." title="Carregando" /> : null}
      {isError ? <PageState description="Não foi possível carregar a lista." title="Erro ao carregar" /> : null}
      {!isLoading && !isError && data?.length === 0 ? (
        <PageState description="Cadastre o primeiro paciente para iniciar." title="Nenhum paciente" />
      ) : null}

      {!isLoading && !isError && data && data.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {data.map((patient) => (
            <Link key={patient.id} to={`/pacientes/${patient.id}`}>
              <PatientCard patient={patient} />
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
};

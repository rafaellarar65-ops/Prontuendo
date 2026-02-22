import { ClinicalPageShell } from '@/components/app/clinical-page-shell';

const scores = [
  { id: 's1', label: 'Risco cardiovascular', value: 'Moderado' },
  { id: 's2', label: 'Score de adesão terapêutica', value: 'Alto' },
  { id: 's3', label: 'Risco metabólico', value: 'Reduzido' },
];

export const ScoresPage = () => (
  <ClinicalPageShell subtitle="Escores clínicos e estratificação de risco" title="Escores">
    <section className="rounded-lg border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-3">
        {scores.map((score) => (
          <div className="rounded border p-3" key={score.id}>
            <p className="text-xs text-muted-foreground">{score.label}</p>
            <p className="mt-1 font-semibold">{score.value}</p>
          </div>
        ))}
      </div>
    </section>
  </ClinicalPageShell>
);

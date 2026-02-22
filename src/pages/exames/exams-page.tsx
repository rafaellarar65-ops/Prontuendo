import { ClinicalPageShell } from '@/components/app/clinical-page-shell';

const exams = [
  { id: 'e1', name: 'Hemoglobina glicada', status: 'Pendente coleta' },
  { id: 'e2', name: 'TSH', status: 'Disponível' },
  { id: 'e3', name: 'Vitamina D', status: 'Aguardando laudo' },
];

export const ExamsPage = () => (
  <ClinicalPageShell subtitle="Monitoramento laboratorial e histórico" title="Exames">
    <section className="rounded-lg border bg-white p-4">
      <ul className="space-y-2 text-sm">
        {exams.map((exam) => (
          <li className="rounded border p-2" key={exam.id}>
            <p className="font-medium">{exam.name}</p>
            <p className="text-muted-foreground">{exam.status}</p>
          </li>
        ))}
      </ul>
    </section>
  </ClinicalPageShell>
);

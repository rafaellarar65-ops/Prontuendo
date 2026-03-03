import { useState } from 'react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { useCreateLabResultMutation } from '@/features/lab-results/use-create-lab-result-mutation';
import { useLabResultsHistoryQuery } from '@/features/lab-results/use-lab-results-history-query';
import { parseBrNumber } from '@/lib/utils/parse-br-number';

export const ExamsPage = () => {
  const [patientId, setPatientId] = useState('');
  const [examNameFilter, setExamNameFilter] = useState('');
  const [examName, setExamName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');

  const { data, isLoading, isError } = useLabResultsHistoryQuery(patientId, examNameFilter || undefined);
  const { mutate: createExam, isPending: isCreating } = useCreateLabResultMutation();

  const isEmpty = Boolean(patientId) && !isLoading && !isError && (!data || data.length === 0);
  const parsedValue = parseBrNumber(value);

  return (
    <ClinicalPageShell
      subtitle="Monitoramento laboratorial e histórico"
      title="Exames"
      isLoading={Boolean(patientId) && isLoading}
      isError={Boolean(patientId) && isError}
      isEmpty={isEmpty}
    >
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="grid gap-2 md:grid-cols-4">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Paciente ID (obrigatório)" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Filtro por exame" value={examNameFilter} onChange={(e) => setExamNameFilter(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Novo exame" value={examName} onChange={(e) => setExamName(e.target.value)} />
          <div className="flex gap-2">
            <input className="w-24 rounded border px-3 py-2 text-sm" placeholder="Valor" value={value} onChange={(e) => setValue(e.target.value)} />
            <input className="w-20 rounded border px-3 py-2 text-sm" placeholder="Unid." value={unit} onChange={(e) => setUnit(e.target.value)} />
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
              disabled={isCreating || !patientId || !examName || parsedValue === undefined}
              onClick={() => {
                if (parsedValue === undefined) return;

                createExam({
                  patientId,
                  examName,
                  value: parsedValue,
                  ...(unit ? { unit } : {}),
                  resultDate: new Date().toISOString(),
                }, { onSuccess: () => { setExamName(''); setValue(''); setUnit(''); } });
              }}
            >
              Criar
            </button>
          </div>
        </div>

        {!patientId ? <p className="text-sm text-muted-foreground">Informe o ID do paciente para carregar o histórico real.</p> : null}

        <ul className="space-y-2 text-sm">
          {(data ?? []).map((exam) => (
            <li className="rounded border p-2" key={exam.id}>
              <p className="font-medium">{exam.examName}</p>
              <p className="text-muted-foreground">
                {exam.value} {exam.unit ?? ''} · {new Date(exam.resultDate).toLocaleDateString('pt-BR')}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </ClinicalPageShell>
  );
};

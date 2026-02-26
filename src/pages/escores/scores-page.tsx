import { useMemo, useState } from 'react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { useCreateScoreMutation, useUpdateScoreMutation } from '@/features/scores/use-score-mutations';
import { useScoresQuery } from '@/features/scores/use-scores-query';

export const ScoresPage = () => {
  const { data, isLoading, isError } = useScoresQuery();
  const { mutate: createScore, isPending: isCreating } = useCreateScoreMutation();
  const { mutate: updateScore } = useUpdateScoreMutation();

  const [search, setSearch] = useState('');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');

  const filtered = useMemo(
    () => (data ?? []).filter((score) => `${score.payload.label} ${score.payload.value}`.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  return (
    <ClinicalPageShell
      subtitle="Escores clínicos e estratificação de risco"
      title="Escores"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && filtered.length === 0}
    >
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="grid gap-2 md:grid-cols-4">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Filtrar" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Nome do escore" value={label} onChange={(e) => setLabel(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Resultado" value={value} onChange={(e) => setValue(e.target.value)} />
          <button
            type="button"
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            disabled={isCreating || !label || !value}
            onClick={() => createScore({ label, value }, { onSuccess: () => { setLabel(''); setValue(''); } })}
          >
            Criar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {filtered.map((score) => (
            <div className="rounded border p-3" key={score.id}>
              <input
                className="w-full rounded border px-2 py-1 text-xs text-muted-foreground"
                defaultValue={score.payload.label}
                onBlur={(e) => e.target.value !== score.payload.label && updateScore({ id: score.id, payload: { label: e.target.value } })}
              />
              <input
                className="mt-2 w-full rounded border px-2 py-1 font-semibold"
                defaultValue={score.payload.value}
                onBlur={(e) => e.target.value !== score.payload.value && updateScore({ id: score.id, payload: { value: e.target.value } })}
              />
            </div>
          ))}
        </div>
      </section>
    </ClinicalPageShell>
  );
};

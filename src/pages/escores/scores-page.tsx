import { useMemo, useState } from 'react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { useCalculateScoreMutation } from '@/features/scores/use-score-mutations';
import { useLatestScoreQuery, useScoreHistoryQuery } from '@/features/scores/use-scores-query';

export const ScoresPage = () => {
  const [patientId, setPatientId] = useState('');
  const [scoreType, setScoreType] = useState<'imc' | 'chads2vasc' | 'hasbled'>('imc');
  const [search, setSearch] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const { data: history, isLoading, isError } = useScoreHistoryQuery(patientId, scoreType);
  const { data: latest } = useLatestScoreQuery(patientId);
  const { mutate: calculateScore, isPending: isCalculating } = useCalculateScoreMutation();

  const filtered = useMemo(
    () =>
      (history ?? []).filter((record) => {
        const text = `${record.scoreType} ${record.result.value} ${record.result.interpretation ?? ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
      }),
    [history, search],
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
        <div className="grid gap-2 md:grid-cols-5">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Paciente (ID)" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
          <select className="rounded border px-3 py-2 text-sm" value={scoreType} onChange={(e) => setScoreType(e.target.value as 'imc' | 'chads2vasc' | 'hasbled')}>
            <option value="imc">IMC</option>
            <option value="chads2vasc">CHA₂DS₂-VASc</option>
            <option value="hasbled">HAS-BLED</option>
          </select>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Filtrar" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Peso (kg)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Altura (cm)" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
        </div>

        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          disabled={isCalculating || !patientId || scoreType !== 'imc' || !weightKg || !heightCm}
          onClick={() =>
            calculateScore({
              patientId,
              scoreType: 'imc',
              inputs: { weightKg: Number(weightKg), heightCm: Number(heightCm) },
            })
          }
        >
          Calcular
        </button>

        {latest ? (
          <p className="text-sm text-muted-foreground">
            Último resultado: {latest.scoreType} = <strong>{latest.result.value}</strong>
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          {filtered.map((record) => (
            <div className="rounded border p-3" key={record.id}>
              <p className="text-xs text-muted-foreground">{record.scoreType}</p>
              <p className="font-semibold">{record.result.value}</p>
              <p className="text-xs">{record.result.interpretation ?? 'Sem interpretação'}</p>
            </div>
          ))}
        </div>
      </section>
    </ClinicalPageShell>
  );
};

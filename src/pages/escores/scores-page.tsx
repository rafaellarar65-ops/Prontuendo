import { useMemo, useState } from 'react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { useCalculateScoreMutation } from '@/features/scores/use-calculate-score-mutation';
import { useLatestByPatientQuery, useScoreHistoryQuery } from '@/features/scores/use-score-history-query';
import type { LatestScoresPayload, ScoreName } from '@/lib/api/scores-api';

const SCORE_NAMES: ScoreName[] = ['BMI', 'HOMA-IR', 'FINDRISC', 'CKD-EPI', 'BMR'];

const metricByScoreName = (latest: LatestScoresPayload | undefined, scoreName: ScoreName) => {
  switch (scoreName) {
    case 'BMI':
      return latest?.imc;
    case 'HOMA-IR':
      return latest?.homaIr;
    default:
      return (latest?.[scoreName] as { value?: string | number | null; interpretation?: string | null } | undefined) ?? undefined;
  }
};

export const ScoresPage = () => {
  const [patientId, setPatientId] = useState('');
  const [scoreName, setScoreName] = useState<ScoreName>('BMI');
  const [search, setSearch] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');

  const { data: history, isLoading, isError } = useScoreHistoryQuery(patientId, scoreName);
  const { data: latest } = useLatestByPatientQuery(patientId, scoreName);
  const { mutate: calculateScore, isPending: isCalculating } = useCalculateScoreMutation();

  const filtered = useMemo(
    () =>
      (history ?? []).filter((record) => {
        const text = `${record.scoreName} ${record.result.value} ${record.result.interpretation ?? ''}`.toLowerCase();
        return text.includes(search.toLowerCase());
      }),
    [history, search],
  );

  const latestMetric = metricByScoreName(latest, scoreName);

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
          <select className="rounded border px-3 py-2 text-sm" value={scoreName} onChange={(e) => setScoreName(e.target.value as ScoreName)}>
            {SCORE_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <input className="rounded border px-3 py-2 text-sm" placeholder="Filtrar" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Peso (kg)" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Altura (cm)" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
        </div>

        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          disabled={isCalculating || !patientId || scoreName !== 'BMI' || !weightKg || !heightCm}
          onClick={() =>
            calculateScore({
              patientId,
              scoreType: 'imc',
              scoreName: 'BMI',
              inputs: { weightKg: Number(weightKg), heightCm: Number(heightCm) },
            })
          }
        >
          Calcular
        </button>

        {latestMetric ? (
          <p className="text-sm text-muted-foreground">
            Último resultado: {scoreName} = <strong>{latestMetric.value ?? '—'}</strong>
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          {filtered.map((record) => (
            <div className="rounded border p-3" key={record.id}>
              <p className="text-xs text-muted-foreground">{record.scoreName}</p>
              <p className="font-semibold">{record.result.value}</p>
              <p className="text-xs">{record.result.interpretation ?? 'Sem interpretação'}</p>
            </div>
          ))}
        </div>
      </section>
    </ClinicalPageShell>
  );
};

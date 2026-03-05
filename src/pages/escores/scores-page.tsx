import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { usePatientDetailQuery } from '@/features/patients/use-patient-detail-query';
import { usePatientsQuery } from '@/features/patients/use-patients-query';
import { useCalculateScoreMutation } from '@/features/scores/use-score-mutations';
import { useScoreHistoryQuery } from '@/features/scores/use-scores-query';
import type { ClinicalScoreHistoryRecord, ScoreType } from '@/lib/api/scores-api';

const SCORE_CARDS = [
  { id: 'homa_ir', label: 'HOMA-IR', description: 'Resistência insulínica' },
  { id: 'findrisc', label: 'FINDRISC', description: 'Risco de DM2 em 10 anos' },
  { id: 'imc', label: 'IMC', description: 'Índice de massa corporal' },
  { id: 'bmr', label: 'BMR', description: 'Taxa metabólica basal' },
  { id: 'ckd_epi', label: 'CKD-EPI', description: 'Função renal (eGFR)' },
] as const;

type CalculatorId = (typeof SCORE_CARDS)[number]['id'];

type InputType = 'number' | 'boolean' | 'select';

interface FieldDefinition {
  key: string;
  label: string;
  type: InputType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

const CALCULATOR_FIELDS: Record<CalculatorId, FieldDefinition[]> = {
  homa_ir: [
    { key: 'fastingGlucose', label: 'Glicemia de jejum (mg/dL)', type: 'number', required: true },
    { key: 'fastingInsulin', label: 'Insulina de jejum (µU/mL)', type: 'number', required: true },
  ],
  findrisc: [
    { key: 'age', label: 'Idade (anos)', type: 'number', required: true },
    { key: 'bmi', label: 'IMC (kg/m²)', type: 'number', required: true },
    { key: 'waistCm', label: 'Circunferência abdominal (cm)', type: 'number' },
    { key: 'physicalActivity', label: 'Atividade física regular', type: 'boolean' },
    { key: 'dailyFruitsVegetables', label: 'Consumo diário de frutas/verduras', type: 'boolean' },
    { key: 'antihypertensiveMedication', label: 'Uso de anti-hipertensivo', type: 'boolean' },
    { key: 'historyHighGlucose', label: 'Histórico de glicose alta', type: 'boolean' },
    { key: 'familyDiabetes', label: 'História familiar de diabetes', type: 'boolean' },
  ],
  imc: [
    { key: 'weightKg', label: 'Peso (kg)', type: 'number', required: true },
    { key: 'heightCm', label: 'Altura (cm)', type: 'number', required: true },
  ],
  bmr: [
    { key: 'weightKg', label: 'Peso (kg)', type: 'number', required: true },
    { key: 'heightCm', label: 'Altura (cm)', type: 'number', required: true },
    { key: 'age', label: 'Idade (anos)', type: 'number', required: true },
    {
      key: 'sex',
      label: 'Sexo biológico',
      type: 'select',
      required: true,
      options: [
        { value: 'male', label: 'Masculino' },
        { value: 'female', label: 'Feminino' },
      ],
    },
  ],
  ckd_epi: [
    { key: 'serumCreatinine', label: 'Creatinina sérica (mg/dL)', type: 'number', required: true },
    { key: 'age', label: 'Idade (anos)', type: 'number', required: true },
    {
      key: 'sex',
      label: 'Sexo biológico',
      type: 'select',
      required: true,
      options: [
        { value: 'male', label: 'Masculino' },
        { value: 'female', label: 'Feminino' },
      ],
    },
  ],
};

const riskBadgeStyles: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  yellow: 'bg-amber-100 text-amber-700 border-amber-300',
  red: 'bg-rose-100 text-rose-700 border-rose-300',
};

const toNumber = (value?: string | number | null): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const parseDate = (iso?: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
};

const calculateAge = (birthDate?: string) => {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday = now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};

const evaluateRisk = (scoreType: CalculatorId, rawValue?: string | number | null, interpretation?: string | null) => {
  const value = toNumber(rawValue);

  if (interpretation) {
    const text = interpretation.toLowerCase();
    if (text.includes('alto') || text.includes('grave') || text.includes('obesidade')) return { color: 'red' as const, label: 'Alto risco' };
    if (text.includes('moderado') || text.includes('limítrofe') || text.includes('sobrepeso')) return { color: 'yellow' as const, label: 'Risco moderado' };
    if (text.includes('baixo') || text.includes('normal') || text.includes('adequado')) return { color: 'green' as const, label: 'Baixo risco' };
  }

  if (value === null) return { color: 'yellow' as const, label: 'Sem classificação' };

  if (scoreType === 'homa_ir') {
    if (value >= 2.9) return { color: 'red' as const, label: 'Resistência importante' };
    if (value >= 2) return { color: 'yellow' as const, label: 'Risco intermediário' };
    return { color: 'green' as const, label: 'Dentro do alvo' };
  }

  if (scoreType === 'findrisc') {
    if (value >= 15) return { color: 'red' as const, label: 'Risco alto' };
    if (value >= 7) return { color: 'yellow' as const, label: 'Risco moderado' };
    return { color: 'green' as const, label: 'Risco baixo' };
  }

  if (scoreType === 'imc') {
    if (value >= 30 || value < 18.5) return { color: 'red' as const, label: 'Alto risco' };
    if (value >= 25) return { color: 'yellow' as const, label: 'Risco moderado' };
    return { color: 'green' as const, label: 'Faixa saudável' };
  }

  if (scoreType === 'ckd_epi') {
    if (value < 60) return { color: 'red' as const, label: 'DRC provável' };
    if (value < 90) return { color: 'yellow' as const, label: 'Atenção renal' };
    return { color: 'green' as const, label: 'Função preservada' };
  }

  if (scoreType === 'bmr') {
    if (value < 1000) return { color: 'red' as const, label: 'Muito baixo' };
    if (value < 1300) return { color: 'yellow' as const, label: 'Baixo' };
    return { color: 'green' as const, label: 'Adequado' };
  }

  return { color: 'yellow' as const, label: 'Sem classificação' };
};

const getLatestByType = (history: ClinicalScoreHistoryRecord[] | undefined, type: CalculatorId) =>
  history?.find((entry) => entry.scoreType === type);

const scoreLabel = (scoreType: CalculatorId) => SCORE_CARDS.find((card) => card.id === scoreType)?.label ?? scoreType;

export const ScoresPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patientId, setPatientId] = useState(searchParams.get('patientId') ?? '');
  const [activeScore, setActiveScore] = useState<CalculatorId>('homa_ir');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: patients } = usePatientsQuery();
  const { data: patient, isLoading: isPatientLoading, isError: isPatientError } = usePatientDetailQuery(patientId || undefined);
  const { data: allHistory, isLoading, isError } = useScoreHistoryQuery(patientId || undefined);
  const { data: activeHistory } = useScoreHistoryQuery(patientId || undefined, activeScore as ScoreType);
  const {
    mutate: calculateScore,
    isPending: isCalculating,
    error: calculateError,
    reset: resetCalculationError,
  } = useCalculateScoreMutation();

  useEffect(() => {
    const queryPatientId = searchParams.get('patientId') ?? '';
    if (queryPatientId !== patientId) {
      setPatientId(queryPatientId);
    }
  }, [patientId, searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (patientId) {
      next.set('patientId', patientId);
    } else {
      next.delete('patientId');
    }
    setSearchParams(next, { replace: true });
  }, [patientId, searchParams, setSearchParams]);

  const latestCards = useMemo(() => {
    return SCORE_CARDS.map((card) => {
      const latest = getLatestByType(allHistory, card.id);
      const risk = evaluateRisk(card.id, latest?.result.value, latest?.result.interpretation);
      return {
        ...card,
        latest,
        risk,
      };
    });
  }, [allHistory]);

  const chartData = useMemo(() => {
    return (activeHistory ?? [])
      .slice()
      .reverse()
      .map((entry) => ({
        id: entry.id,
        label: parseDate(entry.result.calculatedAt || entry.createdAt),
        value: toNumber(entry.result.value) ?? 0,
      }));
  }, [activeHistory]);

  const maxChartValue = useMemo(
    () => Math.max(...chartData.map((point) => point.value), 1),
    [chartData],
  );

  const prefillForm = (calculator: CalculatorId) => {
    const lastInputs = (getLatestByType(allHistory, calculator)?.inputs ?? {}) as Record<string, unknown>;
    const age = calculateAge(patient?.birthDate);
    const sex = patient?.sex === 'F' ? 'female' : patient?.sex === 'M' ? 'male' : '';

    const defaults: Record<string, string> = {
      age: age ? String(age) : '',
      sex,
      weightKg: '',
      heightCm: '',
      fastingGlucose: '',
      fastingInsulin: '',
      bmi: '',
      waistCm: '',
      serumCreatinine: '',
      physicalActivity: 'false',
      dailyFruitsVegetables: 'false',
      antihypertensiveMedication: 'false',
      historyHighGlucose: 'false',
      familyDiabetes: 'false',
    };

    Object.entries(lastInputs).forEach(([key, value]) => {
      defaults[key] = value === undefined || value === null ? '' : String(value);
    });

    setForm(defaults);
    resetCalculationError();
    setIsModalOpen(true);
  };

  const updateField = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = () => {
    if (!patientId) return;
    const fields = CALCULATOR_FIELDS[activeScore];
    const payload = fields.reduce<Record<string, string | number | boolean>>((acc, field) => {
      const raw = form[field.key];
      if (raw === '' || raw === undefined) return acc;
      if (field.type === 'number') {
        acc[field.key] = Number(raw);
      } else if (field.type === 'boolean') {
        acc[field.key] = raw === 'true';
      } else {
        acc[field.key] = raw;
      }
      return acc;
    }, {});

    calculateScore(
      {
        patientId,
        scoreType: activeScore,
        inputs: payload,
      },
      {
        onSuccess: () => setIsModalOpen(false),
      },
    );
  };

  return (
    <ClinicalPageShell
      subtitle="Calculadoras clínicas, risco e evolução temporal"
      title="Escores"
      isLoading={Boolean(patientId) && isLoading}
      isError={Boolean(patientId) && isError}
      isEmpty={Boolean(patientId) && !isLoading && !isError && (allHistory ?? []).length === 0}
    >
      <section className="space-y-4 rounded-lg border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Paciente</label>
            <input
              list="patients-list"
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Paciente (ID)"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value.trim())}
            />
            <datalist id="patients-list">
              {(patients ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </datalist>
            {isPatientLoading ? <p className="text-xs text-slate-500">Carregando dados do paciente…</p> : null}
            {isPatientError ? <p className="text-xs text-rose-600">Não foi possível carregar os dados do paciente.</p> : null}
          </div>
          <div className="rounded border bg-slate-50 p-3 text-sm">
            <p className="text-xs text-slate-500">Paciente selecionado</p>
            <p className="font-medium text-slate-800">{patient?.fullName ?? '—'}</p>
            <p className="text-xs text-slate-500">{patient?.birthDate ? `${parseDate(patient.birthDate)} · ${calculateAge(patient.birthDate) ?? '—'} anos` : 'Sem data de nascimento'}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {latestCards.map((card) => (
            <button
              type="button"
              key={card.id}
              onClick={() => {
                setActiveScore(card.id);
                prefillForm(card.id);
              }}
              className={`rounded-lg border p-4 text-left transition hover:border-slate-400 ${activeScore === card.id ? 'border-slate-800' : ''}`}
            >
              <p className="text-xs text-slate-500">{card.description}</p>
              <h3 className="font-semibold text-slate-900">{card.label}</h3>
              <p className="mt-2 text-2xl font-bold text-slate-900">{card.latest?.result.value ?? '—'}</p>
              <p className="text-xs text-slate-500">{parseDate(card.latest?.result.calculatedAt || card.latest?.createdAt)}</p>
              <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${riskBadgeStyles[card.risk.color]}`}>
                {card.risk.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Evolução temporal · {scoreLabel(activeScore)}</h2>
            <p className="text-xs text-slate-500">Dados vindos do endpoint de histórico por escore ativo.</p>
          </div>
          <button
            type="button"
            className="rounded border px-3 py-2 text-sm font-medium"
            disabled={!patientId}
            onClick={() => prefillForm(activeScore)}
          >
            Calcular {scoreLabel(activeScore)}
          </button>
        </div>

        {!patientId ? <p className="text-sm text-slate-500">Selecione um paciente para visualizar histórico e calcular escores.</p> : null}

        {patientId && chartData.length === 0 ? <p className="text-sm text-slate-500">Sem registros para este escore.</p> : null}

        {chartData.length > 0 ? (
          <div className="space-y-2">
            {chartData.map((point) => (
              <div key={point.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{point.label}</span>
                  <span className="font-medium">{point.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded bg-slate-100">
                  <div className="h-full rounded bg-slate-700" style={{ width: `${(point.value / maxChartValue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Calcular {scoreLabel(activeScore)}</h3>
                <p className="text-xs text-slate-500">Dados pré-preenchidos com histórico e cadastro do paciente quando disponíveis.</p>
              </div>
              <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => setIsModalOpen(false)}>Fechar</button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {CALCULATOR_FIELDS[activeScore].map((field) => (
                <label key={field.key} className="space-y-1 text-sm">
                  <span className="block text-xs font-medium text-slate-600">{field.label}{field.required ? ' *' : ''}</span>
                  {field.type === 'boolean' ? (
                    <select className="w-full rounded border px-3 py-2" value={form[field.key] ?? 'false'} onChange={(e) => updateField(field.key, e.target.value)}>
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  ) : field.type === 'select' ? (
                    <select className="w-full rounded border px-3 py-2" value={form[field.key] ?? ''} onChange={(e) => updateField(field.key, e.target.value)}>
                      <option value="">Selecione</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      className="w-full rounded border px-3 py-2"
                      value={form[field.key] ?? ''}
                      onChange={(e) => updateField(field.key, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>

            {calculateError ? (
              <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                Erro ao calcular escore: {calculateError.message}
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={isCalculating || !patientId}
                onClick={onSubmit}
              >
                {isCalculating ? 'Calculando…' : 'Salvar cálculo'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ClinicalPageShell>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { usePatientsQuery } from '@/features/patients/use-patients-query';
import { useScoresQuery } from '@/features/scores/use-scores-query';
import { scoresApi } from '@/lib/api/scores-api';
import { queryKeys } from '@/lib/query/query-keys';
import type { Patient } from '@/types/api';

const scoreGroups = [
  { key: 'homa', label: 'HOMA-IR/HOMA-β' },
  { key: 'findrisc', label: 'FINDRISC' },
  { key: 'imc-cintura', label: 'IMC + Cintura' },
  { key: 'hba1c', label: 'HbA1c Estimada' },
  { key: 'insulina-inicial', label: 'Dose Inicial de Insulina' },
] as const;

type ScoreType = (typeof scoreGroups)[number]['key'];
type RiskLevel = 'verde' | 'amarelo' | 'laranja' | 'vermelho';

type CalculationResult = {
  scoreValue: string;
  interpretation: string;
  riskLevel: RiskLevel;
};

type ScoreInputs = Record<string, string | number | boolean>;

type ScoreHistory = {
  id: string;
  createdAt: string;
  scoreType: ScoreType;
  patientId: string;
  result: CalculationResult | undefined;
};

const riskBadgeClass: Record<RiskLevel, string> = {
  verde: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amarelo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  laranja: 'bg-orange-100 text-orange-800 border-orange-200',
  vermelho: 'bg-red-100 text-red-800 border-red-200',
};

const toNumber = (value: string | number | boolean) => Number(value);

const calculateLocally = (scoreType: ScoreType, values: ScoreInputs): CalculationResult => {
  if (scoreType === 'homa') {
    const glicose = toNumber(values.glicose ?? 0);
    const insulina = toNumber(values.insulina ?? 0);
    const homaIr = (glicose * insulina) / 405;
    const homaBeta = (360 * insulina) / (glicose - 63);

    const riskLevel: RiskLevel = homaIr < 2 ? 'verde' : homaIr < 2.9 ? 'amarelo' : homaIr < 4 ? 'laranja' : 'vermelho';
    return {
      scoreValue: `HOMA-IR: ${homaIr.toFixed(2)} | HOMA-β: ${Number.isFinite(homaBeta) ? homaBeta.toFixed(2) : 'N/A'}`,
      interpretation: homaIr < 2 ? 'Sem resistência insulínica relevante.' : 'Resistência insulínica presente, correlacionar clinicamente.',
      riskLevel,
    };
  }

  if (scoreType === 'findrisc') {
    const total = [
      'idadePontos',
      'imcPontos',
      'cinturaPontos',
      'atividadeFisicaPontos',
      'frutasVerdurasPontos',
      'antiHipertensivoPontos',
      'glicemiaAltaPontos',
      'historiaFamiliarPontos',
    ].reduce((acc, key) => acc + toNumber(values[key] ?? 0), 0);

    const riskLevel: RiskLevel = total < 7 ? 'verde' : total < 12 ? 'amarelo' : total < 15 ? 'laranja' : 'vermelho';
    return {
      scoreValue: `${total} pontos`,
      interpretation:
        total < 7
          ? 'Risco baixo em 10 anos.'
          : total < 12
            ? 'Risco levemente elevado em 10 anos.'
            : total < 15
              ? 'Risco moderado em 10 anos.'
              : 'Risco alto para DM2 em 10 anos.',
      riskLevel,
    };
  }

  if (scoreType === 'imc-cintura') {
    const peso = toNumber(values.peso ?? 0);
    const altura = toNumber(values.altura ?? 0);
    const cintura = toNumber(values.cintura ?? 0);
    const sexo = String(values.sexo);
    const imc = peso / (altura * altura);
    const cinturaRisco = sexo === 'M' ? (cintura >= 102 ? 'vermelho' : cintura >= 94 ? 'amarelo' : 'verde') : cintura >= 88 ? 'vermelho' : cintura >= 80 ? 'amarelo' : 'verde';
    const imcRisco: RiskLevel = imc < 25 ? 'verde' : imc < 30 ? 'amarelo' : imc < 35 ? 'laranja' : 'vermelho';
    const riskLevel: RiskLevel = (['verde', 'amarelo', 'laranja', 'vermelho'] as RiskLevel[])[Math.max(['verde', 'amarelo', 'laranja', 'vermelho'].indexOf(imcRisco), ['verde', 'amarelo', 'laranja', 'vermelho'].indexOf(cinturaRisco))] as RiskLevel;
    return {
      scoreValue: `IMC: ${imc.toFixed(1)} | Cintura: ${cintura.toFixed(0)} cm`,
      interpretation: 'Avaliação conjunta de obesidade geral e central.',
      riskLevel,
    };
  }

  if (scoreType === 'hba1c') {
    const glicemiaMedia = toNumber(values.glicemiaMedia ?? 0);
    const hba1c = (glicemiaMedia + 46.7) / 28.7;
    const riskLevel: RiskLevel = hba1c < 5.7 ? 'verde' : hba1c < 6.5 ? 'amarelo' : hba1c < 8 ? 'laranja' : 'vermelho';
    return {
      scoreValue: `${hba1c.toFixed(1)}%`,
      interpretation: 'Estimativa de HbA1c a partir da glicemia média informada.',
      riskLevel,
    };
  }

  const peso = toNumber(values.peso ?? 0);
  const doseTipo = String(values.tipoInsulina);
  const fator = doseTipo === 'basal-bolus' ? 0.5 : doseTipo === 'basal' ? 0.2 : 0.3;
  const dose = peso * fator;
  const riskLevel: RiskLevel = dose < 10 ? 'verde' : dose < 20 ? 'amarelo' : dose < 35 ? 'laranja' : 'vermelho';
  return {
    scoreValue: `${dose.toFixed(1)} UI/dia`,
    interpretation: `Dose inicial sugerida para esquema ${doseTipo}.`,
    riskLevel,
  };
};

const fieldError = (field: string, value: string): string | null => {
  if (!value.trim()) return 'Campo obrigatório';
  if (field.includes('Pontos') || ['glicose', 'insulina', 'peso', 'altura', 'cintura', 'glicemiaMedia'].includes(field)) {
    return Number.isNaN(Number(value)) ? 'Informe um número válido' : null;
  }
  return null;
};

const formatDate = (iso: string) => new Date(iso).toLocaleString('pt-BR');

export const ScoresPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const qc = useQueryClient();

  const { data: patients = [] } = usePatientsQuery();
  const { data: scores = [], isLoading, isError } = useScoresQuery();

  const [patientQuery, setPatientQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ScoreType>('homa');
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

  const [formState, setFormState] = useState<Record<ScoreType, Record<string, string>>>(() => ({
    homa: { glicose: '', insulina: '' },
    findrisc: {
      idadePontos: '',
      imcPontos: '',
      cinturaPontos: '',
      atividadeFisicaPontos: '',
      frutasVerdurasPontos: '',
      antiHipertensivoPontos: '',
      glicemiaAltaPontos: '',
      historiaFamiliarPontos: '',
    },
    'imc-cintura': { peso: '', altura: '', cintura: '', sexo: 'F' },
    hba1c: { glicemiaMedia: '' },
    'insulina-inicial': { peso: '', tipoInsulina: 'basal' },
  }));

  const [errors, setErrors] = useState<Record<ScoreType, Record<string, string>>>({
    homa: {},
    findrisc: {},
    'imc-cintura': {},
    hba1c: {},
    'insulina-inicial': {},
  });

  const [results, setResults] = useState<Partial<Record<ScoreType, CalculationResult>>>({});

  useEffect(() => {
    if (!preselectedPatientId || !patients.length) return;
    const preselected = patients.find((patient) => patient.id === preselectedPatientId);
    if (preselected) {
      setSelectedPatient(preselected);
      setPatientQuery(preselected.fullName);
    }
  }, [preselectedPatientId, patients]);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => patient.fullName.toLowerCase().includes(patientQuery.toLowerCase().trim())),
    [patients, patientQuery],
  );

  const history = useMemo<ScoreHistory[]>(() => {
    if (!selectedPatient) return [];
    return scores
      .filter((entry) => {
        const payload = entry.payload as unknown as Record<string, unknown>;
        return payload.patientId === selectedPatient.id && payload.scoreType === activeTab;
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((entry) => {
        const payload = entry.payload as unknown as Record<string, unknown>;
        return {
          id: entry.id,
          createdAt: entry.createdAt,
          patientId: String(payload.patientId ?? ''),
          scoreType: payload.scoreType as ScoreType,
          result: payload.result as CalculationResult | undefined,
        };
      });
  }, [scores, selectedPatient, activeTab]);

  const calculateMutation = useMutation({
    mutationFn: async ({ scoreType, patientId, inputs }: { scoreType: ScoreType; patientId: string; inputs: ScoreInputs }) => {
      const localResult = calculateLocally(scoreType, inputs);
      await scoresApi.calculate({ scoreType, patientId, inputs, result: localResult });
      return scoresApi.create({
        label: scoreGroups.find((group) => group.key === scoreType)?.label ?? scoreType,
        value: localResult.scoreValue,
        patientId,
        scoreType,
        inputs,
        result: localResult,
      });
    },
    onSuccess: (_, variables) => {
      setResults((current) => ({ ...current, [variables.scoreType]: calculateLocally(variables.scoreType, variables.inputs) }));
      void qc.invalidateQueries({ queryKey: queryKeys.scores });
    },
  });

  const updateForm = (scoreType: ScoreType, key: string, value: string) => {
    setFormState((current) => ({
      ...current,
      [scoreType]: { ...current[scoreType], [key]: value },
    }));
  };

  const validateForm = (scoreType: ScoreType) => {
    const nextErrors: Record<string, string> = {};
    Object.entries(formState[scoreType]).forEach(([key, value]) => {
      const error = fieldError(key, value);
      if (error) nextErrors[key] = error;
    });

    setErrors((current) => ({ ...current, [scoreType]: nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleCalculate = (scoreType: ScoreType) => {
    if (!selectedPatient) return;
    if (!validateForm(scoreType)) return;

    const inputs = Object.fromEntries(
      Object.entries(formState[scoreType]).map(([key, value]) => [key, Number.isNaN(Number(value)) ? value : Number(value)]),
    );

    calculateMutation.mutate({ scoreType, patientId: selectedPatient.id, inputs });
  };

  return (
    <ClinicalPageShell title="Escores" subtitle="Calculadoras metabólicas com estratificação de risco" isLoading={isLoading} isError={isError}>
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Paciente</label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="Buscar paciente por nome"
              value={patientQuery}
              onChange={(event) => {
                setPatientQuery(event.target.value);
                setIsPatientDropdownOpen(true);
                setSelectedPatient(null);
              }}
              onFocus={() => setIsPatientDropdownOpen(true)}
            />
            {isPatientDropdownOpen && filteredPatients.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {filteredPatients.slice(0, 8).map((patient) => (
                  <li key={patient.id}>
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setPatientQuery(patient.fullName);
                        setIsPatientDropdownOpen(false);
                      }}
                    >
                      {patient.fullName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {scoreGroups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setActiveTab(group.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${activeTab === group.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {group.label}
              </button>
            ))}
          </div>

          {activeTab === 'homa' && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Glicose (mg/dL)" value={formState.homa.glicose} onChange={(e) => updateForm('homa', 'glicose', e.target.value)} />
                  {errors.homa.glicose && <p className="mt-1 text-xs text-red-600">{errors.homa.glicose}</p>}
                </div>
                <div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Insulina (µU/mL)" value={formState.homa.insulina} onChange={(e) => updateForm('homa', 'insulina', e.target.value)} />
                  {errors.homa.insulina && <p className="mt-1 text-xs text-red-600">{errors.homa.insulina}</p>}
                </div>
              </div>
              <button type="button" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!selectedPatient || calculateMutation.isPending} onClick={() => handleCalculate('homa')}>Calcular e Salvar</button>
            </div>
          )}

          {activeTab === 'findrisc' && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                {Object.keys(formState.findrisc).map((field) => (
                  <div key={field}>
                    <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder={`${field.replace('Pontos', '')} (pontos)`} value={formState.findrisc[field]} onChange={(e) => updateForm('findrisc', field, e.target.value)} />
                    {errors.findrisc[field] && <p className="mt-1 text-xs text-red-600">{errors.findrisc[field]}</p>}
                  </div>
                ))}
              </div>
              <button type="button" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!selectedPatient || calculateMutation.isPending} onClick={() => handleCalculate('findrisc')}>Calcular e Salvar</button>
            </div>
          )}

          {activeTab === 'imc-cintura' && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Peso (kg)" value={formState['imc-cintura'].peso} onChange={(e) => updateForm('imc-cintura', 'peso', e.target.value)} />
                  {errors['imc-cintura'].peso && <p className="mt-1 text-xs text-red-600">{errors['imc-cintura'].peso}</p>}
                </div>
                <div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Altura (m)" value={formState['imc-cintura'].altura} onChange={(e) => updateForm('imc-cintura', 'altura', e.target.value)} />
                  {errors['imc-cintura'].altura && <p className="mt-1 text-xs text-red-600">{errors['imc-cintura'].altura}</p>}
                </div>
                <div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Cintura (cm)" value={formState['imc-cintura'].cintura} onChange={(e) => updateForm('imc-cintura', 'cintura', e.target.value)} />
                  {errors['imc-cintura'].cintura && <p className="mt-1 text-xs text-red-600">{errors['imc-cintura'].cintura}</p>}
                </div>
                <select className="w-full rounded-lg border px-3 py-2 text-sm" value={formState['imc-cintura'].sexo} onChange={(e) => updateForm('imc-cintura', 'sexo', e.target.value)}>
                  <option value="F">Sexo feminino</option>
                  <option value="M">Sexo masculino</option>
                </select>
              </div>
              <button type="button" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!selectedPatient || calculateMutation.isPending} onClick={() => handleCalculate('imc-cintura')}>Calcular e Salvar</button>
            </div>
          )}

          {activeTab === 'hba1c' && (
            <div className="space-y-3">
              <div>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Glicemia média (mg/dL)" value={formState.hba1c.glicemiaMedia} onChange={(e) => updateForm('hba1c', 'glicemiaMedia', e.target.value)} />
                {errors.hba1c.glicemiaMedia && <p className="mt-1 text-xs text-red-600">{errors.hba1c.glicemiaMedia}</p>}
              </div>
              <button type="button" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!selectedPatient || calculateMutation.isPending} onClick={() => handleCalculate('hba1c')}>Calcular e Salvar</button>
            </div>
          )}

          {activeTab === 'insulina-inicial' && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Peso (kg)" value={formState['insulina-inicial'].peso} onChange={(e) => updateForm('insulina-inicial', 'peso', e.target.value)} />
                  {errors['insulina-inicial'].peso && <p className="mt-1 text-xs text-red-600">{errors['insulina-inicial'].peso}</p>}
                </div>
                <select className="w-full rounded-lg border px-3 py-2 text-sm" value={formState['insulina-inicial'].tipoInsulina} onChange={(e) => updateForm('insulina-inicial', 'tipoInsulina', e.target.value)}>
                  <option value="basal">Basal</option>
                  <option value="basal-plus">Basal Plus</option>
                  <option value="basal-bolus">Basal Bolus</option>
                </select>
              </div>
              <button type="button" className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!selectedPatient || calculateMutation.isPending} onClick={() => handleCalculate('insulina-inicial')}>Calcular e Salvar</button>
            </div>
          )}

          {results[activeTab] && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-700">Resultado</h3>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${riskBadgeClass[results[activeTab]!.riskLevel]}`}>
                  {results[activeTab]!.riskLevel}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-slate-900">{results[activeTab]!.scoreValue}</p>
              <p className="mt-1 text-sm text-slate-600">{results[activeTab]!.interpretation}</p>
            </div>
          )}

          <button type="button" onClick={() => setHistoryPanelOpen(true)} className="mt-4 text-sm font-medium text-indigo-700 underline">
            Ver histórico
          </button>
        </section>
      </div>

      {historyPanelOpen && (
        <aside className="fixed right-0 top-0 z-30 h-full w-full max-w-md border-l border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Histórico ({scoreGroups.find((group) => group.key === activeTab)?.label})</h3>
            <button type="button" onClick={() => setHistoryPanelOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>
          {!selectedPatient ? (
            <p className="text-sm text-slate-500">Selecione um paciente para visualizar o histórico.</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum cálculo encontrado para este tipo de escore.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  <p className="mt-1 font-semibold text-slate-800">{item.result?.scoreValue ?? 'Sem valor retornado'}</p>
                  <p className="text-sm text-slate-600">{item.result?.interpretation ?? 'Sem interpretação'}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </ClinicalPageShell>
  );
};

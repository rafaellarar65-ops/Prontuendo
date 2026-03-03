import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Check, ChevronDown, Loader2, Save, Search, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { consultationApi, ConsultationDraft } from '@/lib/api/consultation-api';
import { patientApi } from '@/lib/api/patient-api';
import { aiApi } from '@/lib/api/ai-api';
import { useProtocolsByConditionQuery } from '@/features/protocols/use-protocols-query';
import type { Patient } from '@/types/api';


const CONDITIONS = {
  DM2: 'DM2',
  Hipotireoidismo: 'Hipotireoidismo',
  Obesidade: 'Obesidade',
  Osteoporose: 'Osteoporose',
} as const;

const CONDITION_MATCHERS: Array<{ condition: string; patterns: RegExp[] }> = [
  {
    condition: CONDITIONS.DM2,
    patterns: [
      /\bdm\s*2\b/i,
      /\bdm2\b/i,
      /diabetes\s*mellitus\s*tipo\s*2/i,
      /diabetes\s*tipo\s*2/i,
    ],
  },
  {
    condition: CONDITIONS.Hipotireoidismo,
    patterns: [/hipotireoidismo/i, /hipotireoide/i, /\be03\b/i],
  },
  { condition: CONDITIONS.Obesidade, patterns: [/obesidade/i, /\be66\b/i] },
  {
    condition: CONDITIONS.Osteoporose,
    patterns: [/osteoporose/i, /\bm80\b/i, /\bm81\b/i],
  },
];

const normalizeConditionFromAssessment = (assessment: string): string | null => {
  if (!assessment) return null;

  const normalized = assessment
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const match = CONDITION_MATCHERS.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(normalized)),
  );

  return match?.condition ?? null;
};

// ── Patient Selector ─────────────────────────────────────────────
const PatientSelector = ({
  selected,
  onSelect,
}: {
  selected: Patient | null;
  onSelect: (p: Patient) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: patientApi.list });

  const filtered = (patients ?? []).filter((p) =>
    p.fullName.toLowerCase().includes(q.toLowerCase()),
  );

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold text-white text-sm">
          {selected.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">{selected.fullName}</p>
          {selected.birthDate && (
            <p className="text-xs text-slate-500">
              {Math.floor((Date.now() - new Date(selected.birthDate).getTime()) / 3.156e10)} anos
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSelect(null as unknown as Patient)}
          className="rounded-lg p-1 text-slate-400 hover:bg-indigo-100 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm hover:border-indigo-300 hover:bg-indigo-50"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Selecionar paciente...</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute top-full z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </div>
          <ul className="max-h-56 overflow-auto divide-y divide-slate-50">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-400">Nenhum paciente encontrado.</li>
            )}
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => { onSelect(p); setOpen(false); setQ(''); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 font-bold text-white text-xs">
                    {p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.fullName}</p>
                    {p.birthDate && (
                      <p className="text-xs text-slate-400">
                        {Math.floor((Date.now() - new Date(p.birthDate).getTime()) / 3.156e10)} anos
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ── SOAP Section ─────────────────────────────────────────────────
const SoapSection = ({
  label,
  field,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, val: string) => void;
  placeholder: string;
  rows?: number;
}) => (
  <div>
    <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-100 text-xs font-bold text-indigo-700">
        {(field[0] ?? '').toUpperCase()}
      </span>
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
    />
  </div>
);

// ── AI Panel ─────────────────────────────────────────────────────
const AiPanel = ({
  patient,
  draft,
}: {
  patient: Patient | null;
  draft: ConsultationDraft;
}) => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!patient) return;
    setLoading(true);
    setError('');
    try {
      const r = await aiApi.assistConsultation({
        patient: { name: patient.fullName, age: patient.birthDate ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / 3.156e10) : null },
        queixas: draft.subjetivo ?? '',
        historico: draft.objetivo ?? '',
        avaliacao: draft.avaliacao ?? '',
      });
      setResult(r as Record<string, unknown>);
    } catch {
      setError('Erro ao chamar assistente IA. Verifique a chave Gemini.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Bot size={18} className="text-indigo-600" />
        <h2 className="font-semibold text-slate-800">Assistente IA</h2>
      </div>
      <p className="text-xs text-slate-500">
        Análise de hipóteses diagnósticas e plano de investigação baseados no conteúdo da consulta.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={loading || !patient}
        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
        {loading ? 'Analisando...' : 'Analisar com IA'}
      </button>
      {!patient && <p className="text-xs text-amber-600">Selecione um paciente para usar o assistente.</p>}
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
      {result && !loading && (
        <div className="space-y-3 text-xs">
          {(result as any).clinicalSummary && (
            <div>
              <p className="font-semibold text-slate-700 mb-1">Resumo clínico</p>
              <p className="text-slate-600 leading-relaxed">{(result as any).clinicalSummary}</p>
            </div>
          )}
          {(result as any).differentialDiagnoses?.length > 0 && (
            <div>
              <p className="font-semibold text-slate-700 mb-1">Hipóteses diagnósticas</p>
              <ul className="space-y-1">
                {(result as any).differentialDiagnoses.slice(0, 3).map((d: any, i: number) => (
                  <li key={i} className="rounded-lg bg-indigo-50 px-2 py-1.5">
                    <p className="font-medium text-indigo-800">{d.hypothesis}</p>
                    <p className="text-indigo-600">{d.clinicalRationale}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(result as any).redFlags?.length > 0 && (
            <div>
              <p className="font-semibold text-rose-600 mb-1">Alertas</p>
              <ul className="space-y-0.5">
                {(result as any).redFlags.map((f: string, i: number) => (
                  <li key={i} className="text-rose-600">• {f}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-slate-400 italic leading-relaxed">{(result as any).safety?.disclaimer}</p>
        </div>
      )}
    </aside>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
export const NewConsultationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const preselectedPatientId = searchParams.get('patientId');
  const { data: allPatients } = useQuery({ queryKey: ['patients'], queryFn: patientApi.list });

  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ConsultationDraft>({ subjetivo: '', objetivo: '', avaliacao: '', plano: '' });
  const [saved, setSaved] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [debouncedAssessment, setDebouncedAssessment] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const nextAssessment = draft.avaliacao?.trim() ?? '';

    if (nextAssessment.length < 4) {
      setDebouncedAssessment('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedAssessment(nextAssessment);
    }, 450);

    return () => clearTimeout(timer);
  }, [draft.avaliacao]);

  const recognizedCondition = useMemo(
    () => normalizeConditionFromAssessment(debouncedAssessment),
    [debouncedAssessment],
  );

  const { data: protocolsByCondition, isFetching: isFetchingProtocols } = useProtocolsByConditionQuery(recognizedCondition ?? undefined);

  // Pre-select patient from URL
  useEffect(() => {
    if (preselectedPatientId && allPatients) {
      const p = allPatients.find((p) => p.id === preselectedPatientId);
      if (p) setPatient(p);
    }
  }, [preselectedPatientId, allPatients]);

  const createMutation = useMutation({
    mutationFn: (patientId: string) => consultationApi.create({ patientId }),
    onSuccess: (c) => setConsultationId(c.id),
  });

  const autosaveMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: ConsultationDraft }) => consultationApi.autosave(id, d),
    onSuccess: () => { setSavingStatus('saved'); setTimeout(() => setSavingStatus('idle'), 2000); },
    onError: () => { setSavingStatus('idle'); },
  });

  const finalizeMutation = useMutation({
    mutationFn: (id: string) => consultationApi.finalize(id),
    onSuccess: () => {
      setSaved(true);
      void qc.invalidateQueries({ queryKey: ['consultations'] });
      setTimeout(() => navigate('/'), 2000);
    },
  });

  // Create consultation on patient select
  useEffect(() => {
    if (patient && !consultationId) {
      createMutation.mutate(patient.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  const handleChange = useCallback((field: string, value: string) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      // Autosave debounce
      if (consultationId) {
        clearTimeout(autoSaveTimer.current);
        setSavingStatus('saving');
        autoSaveTimer.current = setTimeout(() => {
          autosaveMutation.mutate({ id: consultationId, d: next });
        }, 1500);
      }
      return next;
    });
  }, [consultationId, autosaveMutation]);

  const handleManualSave = () => {
    if (!consultationId) return;
    clearTimeout(autoSaveTimer.current);
    autosaveMutation.mutate({ id: consultationId, d: draft });
  };

  const handleFinalize = () => {
    if (!consultationId) return;
    finalizeMutation.mutate(consultationId);
  };

  const isEmpty = !draft.subjetivo && !draft.objetivo && !draft.avaliacao && !draft.plano;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nova Consulta</h1>
          <p className="text-sm text-slate-500 mt-0.5">Prontuário SOAP com salvamento automático</p>
        </div>
        <div className="flex items-center gap-3">
          {savingStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin" /> Salvando...
            </span>
          )}
          {savingStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <Check size={12} /> Salvo
            </span>
          )}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!consultationId || autosaveMutation.isPending}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            data-testid="save-draft-btn"
          >
            <Save size={14} /> Salvar rascunho
          </button>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={!consultationId || isEmpty || finalizeMutation.isPending || saved}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
            data-testid="finalize-consultation-btn"
          >
            {finalizeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saved ? 'Finalizado!' : 'Finalizar consulta'}
          </button>
        </div>
      </div>

      {/* Finalized banner */}
      {saved && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <Check size={18} className="text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">Consulta finalizada e assinada com hash. Redirecionando...</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Patient */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Paciente</h2>
            <PatientSelector
              selected={patient}
              onSelect={(p) => { setPatient(p); setConsultationId(null); }}
            />
            {createMutation.isPending && (
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 size={11} className="animate-spin" /> Criando consulta...
              </p>
            )}
          </div>

          {/* SOAP Form */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-slate-700">Prontuário SOAP</h2>
            <SoapSection
              label="Subjetivo — Queixa principal e histórico"
              field="subjetivo"
              value={draft.subjetivo ?? ''}
              onChange={handleChange}
              placeholder="Paciente refere... Há... meses. Nega..."
            />
            <SoapSection
              label="Objetivo — Exame físico e dados mensuráveis"
              field="objetivo"
              value={draft.objetivo ?? ''}
              onChange={handleChange}
              placeholder="PA: / FC: / Peso: kg / Altura: m / IMC: / Circunferência abdominal: cm..."
            />
            <SoapSection
              label="Avaliação — Hipóteses diagnósticas"
              field="avaliacao"
              value={draft.avaliacao ?? ''}
              onChange={handleChange}
              placeholder="1. Diabetes Mellitus tipo 2 — controlada / 2. Obesidade grau II..."
            />
            {recognizedCondition && (protocolsByCondition?.length ?? 0) > 0 && (
              <div className="-mt-2 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs">
                <span className="font-medium text-emerald-800">Protocolo disponível para {recognizedCondition}</span>
                <button
                  type="button"
                  onClick={() => navigate(`/protocolos?condition=${encodeURIComponent(recognizedCondition)}`)}
                  className="rounded-md border border-emerald-200 bg-white px-2 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Visualizar/aplicar
                </button>
                {isFetchingProtocols && <Loader2 size={12} className="animate-spin text-emerald-600" />}
              </div>
            )}
            <SoapSection
              label="Plano — Conduta terapêutica"
              field="plano"
              value={draft.plano ?? ''}
              onChange={handleChange}
              placeholder="1. Manter metformina 850mg 2x/dia. 2. Solicitar HbA1c, lipidograma. 3. Retorno em 90 dias..."
              rows={6}
            />
          </div>
        </div>

        {/* AI Panel */}
        <AiPanel patient={patient} draft={draft} />
      </div>
    </div>
  );
};

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Check, ChevronDown, History, Loader2, Save, Search, X, Mic, FileText, Pill, Stethoscope, Activity, FileSpreadsheet, BarChart2, ClipboardList } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { consultationApi, ConsultationDraft, ConsultationVersionDetail } from '@/lib/api/consultation-api';
import { patientApi } from '@/lib/api/patient-api';
import { aiApi, type AssistConsultationResponse } from '@/lib/api/ai-api';
import { useProtocolsByConditionQuery } from '@/features/protocols/use-protocols-query';
import { useConsultationVersionQuery, useConsultationVersionsQuery } from '@/features/consultations/use-consultation-versions-query';
import { PatientExamsTab } from '@/components/domain/patient-exams-tab';
import { PatientBioimpedanceTab } from '@/components/domain/patient-bioimpedance-tab';
import { PatientScoresTab } from '@/components/domain/patient-scores-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const extractSectionText = (content: Record<string, unknown> | null | undefined, key: string): string => {
  const candidate = content?.[key];
  if (candidate && typeof candidate === 'object' && 'text' in candidate) {
    return typeof (candidate as { text?: unknown }).text === 'string' ? (candidate as { text: string }).text : '';
  }

  return '';
};

const versionContentToDraft = (content: Record<string, unknown> | null | undefined): ConsultationDraft => ({
  subjetivo: extractSectionText(content, 'anamnese'),
  objetivo: extractSectionText(content, 'exameFisico'),
  avaliacao: extractSectionText(content, 'diagnostico'),
  plano: extractSectionText(content, 'prescricao'),
});

const formatRelativeTime = (isoDate: string): string => {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
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

// ── Clinical Brain Panel ─────────────────────────────────────────
const ClinicalBrainPanel = ({
  patient,
  draft,
}: {
  patient: Patient | null;
  draft: ConsultationDraft;
}) => {
  const [result, setResult] = useState<AssistConsultationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const run = async () => {
    if (!patient) return;
    setLoading(true);
    setError('');
    try {
      const r = await aiApi.assistConsultation({
        patientId: patient.id,
        patient: { name: patient.fullName, age: patient.birthDate ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / 3.156e10) : null },
        queixas: draft.subjetivo ?? '',
        historico: draft.objetivo ?? '',
        avaliacao: draft.avaliacao ?? '',
      });
      setResult(r);
    } catch {
      setError('Erro ao chamar assistente IA. Verifique a chave Gemini.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="space-y-4">
      {/* Cérebro Clínico - Passive Listening */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-indigo-600" />
          <h2 className="font-semibold text-slate-800">Cérebro Clínico</h2>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Escuta Passiva</h3>
          <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <button
              onClick={() => setIsListening(!isListening)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-white text-slate-400 border border-slate-200'}`}
            >
              <Mic size={18} />
            </button>
            <p className="text-xs text-slate-500 italic">
              {isListening ? 'Ouvindo consulta...' : 'Nenhum áudio captado.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
           <div className="flex items-center justify-between">
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plano Sugerido</h3>
             <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{(result?.differentialDiagnoses?.length ?? 0) + (result?.redFlags?.length ?? 0)} itens</span>
           </div>
           
           {!result && !loading && (
             <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
               <p className="text-xs text-slate-400">Nenhuma sugestão pendente.</p>
               <button
                type="button"
                onClick={run}
                disabled={!patient}
                className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
               >
                 Analisar dados inseridos
               </button>
             </div>
           )}

           {loading && (
             <div className="flex items-center justify-center py-4 text-slate-400 gap-2 text-xs">
               <Loader2 size={14} className="animate-spin" /> Analisando contexto...
             </div>
           )}

           {error && <p className="text-xs text-rose-600">{error}</p>}

           {result && !loading && (
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-indigo-700">
                <p className="font-semibold">Contexto analisado</p>
                <p className="mt-1 opacity-80">
                  {result.dataAvailability.glucoseCount} glicemias, {result.dataAvailability.labCount} exames, {result.dataAvailability.bioCount} bioimpedâncias
                </p>
              </div>
              
              {(result.redFlags?.length ?? 0) > 0 && (
                <div>
                  <p className="font-semibold text-rose-600 mb-1">Alertas</p>
                  <ul className="space-y-1">
                    {(result.redFlags ?? []).map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-rose-700">
                        <span className="mt-0.5 block h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(result.differentialDiagnoses?.length ?? 0) > 0 && (
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Hipóteses</p>
                  <ul className="space-y-2">
                    {(result.differentialDiagnoses ?? []).slice(0, 3).map((d, i: number) => (
                      <li key={i} className="rounded-lg bg-slate-50 p-2">
                        <p className="font-medium text-slate-800">{d.hypothesis}</p>
                        <p className="mt-1 text-slate-500 leading-relaxed">{d.clinicalRationale}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
           )}
        </div>
      </div>

      {/* Document Emission */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-slate-800">Emissão de Documentos</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => patient && navigate(`/prescricoes?patientId=${patient.id}&openNew=true`)}
            disabled={!patient}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 hover:bg-indigo-50 hover:border-indigo-100 transition disabled:opacity-50"
          >
             <Pill size={20} className="text-indigo-600" />
             <span className="text-xs font-medium text-slate-700">Nova Receita</span>
          </button>
          <button
            onClick={() => navigate('/templates')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 hover:bg-indigo-50 hover:border-indigo-100 transition"
          >
             <FileText size={20} className="text-indigo-600" />
             <span className="text-xs font-medium text-slate-700">Novo Laudo</span>
          </button>
        </div>
      </div>
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);
  const [debouncedAssessment, setDebouncedAssessment] = useState('');
  const [activeTab, setActiveTab] = useState('anamnese');
  
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
  const { data: versions = [], isLoading: isLoadingVersions } = useConsultationVersionsQuery(consultationId);
  const latestVersion = versions[0] ?? null;

  useEffect(() => {
    if (!selectedVersionNumber && latestVersion) {
      setSelectedVersionNumber(latestVersion.version);
    }
  }, [latestVersion, selectedVersionNumber]);

  const { data: selectedVersion, isLoading: isLoadingVersionDetail } = useConsultationVersionQuery(
    consultationId,
    historyOpen ? selectedVersionNumber : null,
  );

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

  const handleRestoreVersion = (versionDetail: ConsultationVersionDetail) => {
    if (!consultationId || versionDetail.isFinal) return;

    const restoredDraft = versionContentToDraft(versionDetail.content);
    setDraft(restoredDraft);
    clearTimeout(autoSaveTimer.current);
    setSavingStatus('saving');
    autosaveMutation.mutate({ id: consultationId, d: restoredDraft });
  };

  const diffSections = useMemo(() => {
    const selectedDraft = versionContentToDraft(selectedVersion?.content);

    return [
      { key: 'subjetivo', label: 'S', changed: (selectedDraft.subjetivo ?? '').trim() !== (draft.subjetivo ?? '').trim() },
      { key: 'objetivo', label: 'O', changed: (selectedDraft.objetivo ?? '').trim() !== (draft.objetivo ?? '').trim() },
      { key: 'avaliacao', label: 'A', changed: (selectedDraft.avaliacao ?? '').trim() !== (draft.avaliacao ?? '').trim() },
      { key: 'plano', label: 'P', changed: (selectedDraft.plano ?? '').trim() !== (draft.plano ?? '').trim() },
    ];
  }, [selectedVersion?.content, draft]);

  const isEmpty = !draft.subjetivo && !draft.objetivo && !draft.avaliacao && !draft.plano;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Consulta Ativa</h1>
          {patient && (
             <p className="text-sm text-slate-500 mt-0.5 font-medium">Atendendo: {patient.fullName}</p>
          )}
          {!patient && <p className="text-sm text-slate-500 mt-0.5">Selecione um paciente para iniciar</p>}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            disabled={!consultationId}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
          >
            <History size={14} /> Histórico ({versions.length})
          </button>
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
          {/* Patient Selector (Only if not selected) */}
          {!patient && (
             <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                <h2 className="text-sm font-semibold text-slate-700">Identificação</h2>
                <PatientSelector
                  selected={patient}
                  onSelect={(p) => {
                    setPatient(p);
                    setConsultationId(null);
                    setSelectedVersionNumber(null);
                    setHistoryOpen(false);
                  }}
                />
             </div>
          )}

          {/* Main Tabs */}
          {patient && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm min-h-[600px]">
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="mb-6 w-full justify-start gap-2 bg-slate-50 p-1.5">
                    <TabsTrigger value="anamnese"><ClipboardList size={14} className="mr-2"/> ANAMNESE</TabsTrigger>
                    <TabsTrigger value="exame-fisico"><Stethoscope size={14} className="mr-2"/> EXAME FÍSICO</TabsTrigger>
                    <TabsTrigger value="exames"><FileSpreadsheet size={14} className="mr-2"/> EXAMES</TabsTrigger>
                    <TabsTrigger value="bioimpedancia"><Activity size={14} className="mr-2"/> BIOIMPEDÂNCIA</TabsTrigger>
                    <TabsTrigger value="escores"><BarChart2 size={14} className="mr-2"/> ESCORES</TabsTrigger>
                    <TabsTrigger value="prescricao"><Pill size={14} className="mr-2"/> PRESCRIÇÃO</TabsTrigger>
                 </TabsList>

                 <TabsContent value="anamnese" className="space-y-6">
                    <SoapSection
                      label="Queixa principal e histórico (Subjetivo)"
                      field="subjetivo"
                      value={draft.subjetivo ?? ''}
                      onChange={handleChange}
                      placeholder="Paciente refere... Há... meses. Nega..."
                      rows={12}
                    />
                    <div className="border-t border-slate-100 pt-6">
                      <SoapSection
                        label="Hipóteses diagnósticas (Avaliação)"
                        field="avaliacao"
                        value={draft.avaliacao ?? ''}
                        onChange={handleChange}
                        placeholder="1. Diabetes Mellitus tipo 2 — controlada / 2. Obesidade grau II..."
                      />
                      {recognizedCondition && (protocolsByCondition?.length ?? 0) > 0 && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs">
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
                    </div>
                 </TabsContent>

                 <TabsContent value="exame-fisico">
                    <SoapSection
                      label="Exame físico e dados mensuráveis (Objetivo)"
                      field="objetivo"
                      value={draft.objetivo ?? ''}
                      onChange={handleChange}
                      placeholder="PA: / FC: / Peso: kg / Altura: m / IMC: / Circunferência abdominal: cm..."
                      rows={16}
                    />
                 </TabsContent>

                 <TabsContent value="exames">
                    <PatientExamsTab patientId={patient.id} />
                 </TabsContent>

                 <TabsContent value="bioimpedancia">
                    <PatientBioimpedanceTab patientId={patient.id} patient={patient} />
                 </TabsContent>

                 <TabsContent value="escores">
                    <PatientScoresTab patientId={patient.id} patient={patient} />
                 </TabsContent>

                 <TabsContent value="prescricao">
                    <div className="flex items-center justify-end mb-4">
                       <button
                         onClick={() => patient && navigate(`/prescricoes?patientId=${patient.id}&openNew=true`)}
                         className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                       >
                          <Pill size={14} /> Nova Receita (Builder)
                       </button>
                    </div>
                    <SoapSection
                      label="Conduta terapêutica (Plano)"
                      field="plano"
                      value={draft.plano ?? ''}
                      onChange={handleChange}
                      placeholder="1. Manter metformina 850mg 2x/dia. 2. Solicitar HbA1c, lipidograma. 3. Retorno em 90 dias..."
                      rows={16}
                    />
                 </TabsContent>
               </Tabs>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <ClinicalBrainPanel patient={patient} draft={draft} />
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-900/20 transition-opacity ${historyOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setHistoryOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-80 border-l border-slate-200 bg-white shadow-xl transition-transform ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Histórico de versões</h3>
          <button type="button" onClick={() => setHistoryOpen(false)} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="grid h-[calc(100%-53px)] grid-rows-[1fr_1fr]">
          <div className="overflow-auto border-b border-slate-100 p-3 space-y-2">
            {isLoadingVersions && <p className="text-xs text-slate-500">Carregando versões...</p>}
            {!isLoadingVersions && versions.length === 0 && <p className="text-xs text-slate-500">Sem versões disponíveis.</p>}
            {versions.map((v) => (
              <button
                key={v.version}
                type="button"
                onClick={() => setSelectedVersionNumber(v.version)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition ${selectedVersionNumber === v.version ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">v{v.version}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${v.isFinal ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                    {v.isFinal ? 'Final' : 'Rascunho'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{new Date(v.createdAt).toLocaleString('pt-BR')}</p>
              </button>
            ))}
          </div>

          <div className="overflow-auto p-3 space-y-3">
            {!selectedVersionNumber && <p className="text-xs text-slate-500">Selecione uma versão para visualizar.</p>}
            {isLoadingVersionDetail && <p className="text-xs text-slate-500">Carregando conteúdo...</p>}
            {selectedVersion && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">Comparação com rascunho atual</p>
                  <button
                    type="button"
                    onClick={() => handleRestoreVersion(selectedVersion)}
                    disabled={selectedVersion.isFinal || saved}
                    className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Restaurar esta versão
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {diffSections.map((section) => (
                    <div
                      key={section.key}
                      className={`rounded-md px-2 py-1 text-center text-[11px] font-semibold ${section.changed ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                    >
                      {section.label}: {section.changed ? 'Mudou' : 'Igual'}
                    </div>
                  ))}
                </div>

                {selectedVersion.isFinal && (
                  <p className="rounded-md bg-purple-50 px-2 py-1.5 text-[11px] text-purple-700">
                    Versão final da consulta. Restauração indisponível.
                  </p>
                )}

                <pre className="max-h-56 overflow-auto rounded-lg bg-slate-900 p-2 text-[11px] text-slate-100">
                  {JSON.stringify(selectedVersion.content, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
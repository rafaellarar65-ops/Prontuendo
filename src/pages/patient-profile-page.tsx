import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Calendar, ChevronRight, Edit2, FileText, Loader2,
  Phone, Mail, MapPin, Plus, Stethoscope, User, X,
} from 'lucide-react';
import { patientApi } from '@/lib/api/patient-api';
import { consultationApi } from '@/lib/api/consultation-api';
import { scoresApi } from '@/lib/api/scores-api';
import { useLabResultsQuery } from '@/features/lab-results/use-lab-results-query';
import { useCreateLabResultMutation } from '@/features/lab-results/use-create-lab-result-mutation';
import { useGlucoseAnalysisQuery } from '@/features/glucose/use-glucose-analysis-query';
import { useGlucoseQuery } from '@/features/glucose/use-glucose-query';
import { useCreateGlucoseMutation } from '@/features/glucose/use-create-glucose-mutation';
import { useBioimpedanceEvolutionQuery } from '@/features/bioimpedance/use-bioimpedance-evolution-query';
import { bioimpedanceApi } from '@/lib/api/bioimpedance-api';
import { aiApi } from '@/lib/api/ai-api';
import type { CreateLabResultDto } from '@/types/clinical-modules';
import type { BioimpedancePoint } from '@/types/bioimpedance';
import type { Patient, UpdatePatientDto } from '@/types/api';
import { parseBrNumber } from '@/lib/utils/parse-br-number';

const calcAge = (bd?: string) =>
  bd ? Math.floor((Date.now() - new Date(bd).getTime()) / 3.156e10) : null;

const SEX_LABEL: Record<string, string> = { F: 'Feminino', M: 'Masculino', OUTRO: 'Outro', NI: 'Não informado' };

// ── Edit Patient Modal ──────────────────────────────────────────
const EditPatientModal = ({
  patient,
  onClose,
}: {
  patient: Patient;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<UpdatePatientDto>({
    fullName: patient.fullName,
    birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : '',
    sex: patient.sex ?? 'NI',
    cpf: patient.cpf ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    address: patient.address ?? '',
    notes: patient.notes ?? '',
  });

  const mut = useMutation({
    mutationFn: (dto: UpdatePatientDto) => patientApi.update(patient.id, dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', patient.id] });
      void qc.invalidateQueries({ queryKey: ['patients'] });
      onClose();
    },
  });

  const set = (k: keyof UpdatePatientDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-slate-800">Editar paciente</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>
        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => { e.preventDefault(); mut.mutate(form); }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Nome completo *</label>
              <input required value={form.fullName ?? ''} onChange={set('fullName')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Data de nascimento</label>
              <input type="date" value={form.birthDate ?? ''} onChange={set('birthDate')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sexo</label>
              <select value={form.sex ?? 'NI'} onChange={set('sex')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400">
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="OUTRO">Outro</option>
                <option value="NI">Não informado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">CPF</label>
              <input value={form.cpf ?? ''} onChange={set('cpf')} placeholder="000.000.000-00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefone</label>
              <input value={form.phone ?? ''} onChange={set('phone')} placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
              <input type="email" value={form.email ?? ''} onChange={set('email')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Endereço</label>
              <input value={form.address ?? ''} onChange={set('address')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Observações</label>
              <textarea value={form.notes ?? ''} onChange={set('notes')} rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button type="submit" disabled={mut.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60">
              {mut.isPending && <Loader2 size={13} className="animate-spin" />}
              {mut.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Consultations Tab ───────────────────────────────────────────
const ConsultationsTab = ({ patientId }: { patientId: string }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['consultations', patientId],
    queryFn: () => consultationApi.list(patientId),
  });

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{data?.length ?? 0} consulta(s)</p>
        <button
          onClick={() => navigate(`/consultas/nova?patientId=${patientId}`)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={13} /> Nova consulta
        </button>
      </div>
      {(!data || data.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-slate-400">
          <FileText size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Nenhuma consulta registrada.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((c) => (
            <li key={c.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold ${c.status === 'FINALIZED' ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                {c.status === 'FINALIZED' ? 'F' : 'R'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {c.status === 'FINALIZED' ? 'Consulta finalizada' : 'Rascunho'}
                </p>
                <p className="text-xs text-slate-400">{new Date(c.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Exams Tab ─────────────────────────────────────────────────────
type LabResult = { id: string; patientId: string; examName: string; value: number; unit?: string | null; reference?: string | null; resultDate: string };

const getLabResultStatus = (result: LabResult) => {
  if (!result.reference) return { label: 'Sem referência', cls: 'bg-slate-100 text-slate-600' };
  const parts = result.reference.match(/(-?\d+(?:[.,]\d+)?)\s*[-a]\s*(-?\d+(?:[.,]\d+)?)/i);
  if (!parts) return { label: result.reference, cls: 'bg-slate-100 text-slate-600' };
  const min = Number((parts[1] ?? '').replace(',', '.'));
  const max = Number((parts[2] ?? '').replace(',', '.'));
  if (Number.isNaN(min) || Number.isNaN(max)) return { label: result.reference, cls: 'bg-slate-100 text-slate-600' };
  if (result.value < min || result.value > max) return { label: 'Fora da referência', cls: 'bg-rose-100 text-rose-700' };
  return { label: 'Dentro da referência', cls: 'bg-emerald-100 text-emerald-700' };
};

const ExamsTab = ({ patientId }: { patientId: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateLabResultDto>({ patientId, examName: '', value: 0, unit: '', reference: '', resultDate: new Date().toISOString().slice(0, 10) });
  const [valueInput, setValueInput] = useState('');
  const { data, isLoading } = useLabResultsQuery(patientId);
  const { mutate, isPending } = useCreateLabResultMutation();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseBrNumber(valueInput);
    if (parsedValue === undefined) return;

    mutate({ ...form, patientId, value: parsedValue, resultDate: new Date(form.resultDate).toISOString(), ...(form.unit ? { unit: form.unit } : {}), ...(form.reference ? { reference: form.reference } : {}) }, {
      onSuccess: () => {
        setShowModal(false);
        setValueInput('');
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{data?.length ?? 0} exame(s)</p>
        <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus size={13} /> Adicionar exame</button>
      </div>
      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-2 pr-2">Data</th><th className="py-2 pr-2">Exame</th><th className="py-2 pr-2">Resultado</th><th className="py-2 pr-2">Referência</th><th className="py-2">Status</th></tr></thead>
            <tbody>
              {(data ?? []).map((exam) => {
                const status = getLabResultStatus(exam);
                return (
                  <tr key={exam.id} className="border-b last:border-none">
                    <td className="py-2 pr-2">{new Date(exam.resultDate).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 pr-2 font-medium text-slate-700">{exam.examName}</td>
                    <td className="py-2 pr-2">{exam.value} {exam.unit ?? ''}</td>
                    <td className="py-2 pr-2">{exam.reference ?? '—'}</td>
                    <td className="py-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.cls}`}>{status.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!data || !data.length) && <p className="py-4 text-center text-sm text-slate-400">Nenhum exame registrado.</p>}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-semibold text-slate-800">Adicionar exame</h3>
            <input required placeholder="Nome do exame" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setForm((p) => ({ ...p, examName: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input required type="text" inputMode="decimal" placeholder="Valor" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={valueInput} onChange={(e) => setValueInput(e.target.value)} />
              <input placeholder="Unidade" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
              <input placeholder="Referência (ex: 70-99)" className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} />
              <input required type="date" value={form.resultDate.slice(0, 10)} className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" onChange={(e) => setForm((p) => ({ ...p, resultDate: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button>
              <button disabled={isPending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ── Glucose Tab ───────────────────────────────────────────────────
const GlucoseSparkline = ({ values }: { values: number[] }) => {
  if (!values.length) return <p className="text-xs text-slate-400">Sem dados para gráfico.</p>;
  const w = 260; const h = 80;
  const min = Math.min(...values); const max = Math.max(...values);
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * w;
    const y = h - ((v - min) / Math.max(max - min, 1)) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  return <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full"><polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={points} /></svg>;
};

const GlucoseTab = ({ patientId }: { patientId: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const { data: analysis } = useGlucoseAnalysisQuery(patientId);
  const { data, isLoading } = useGlucoseQuery(patientId);
  const { mutate, isPending } = useCreateGlucoseMutation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <p>Média: <span className="font-semibold text-slate-700">{analysis?.average ?? 0} mg/dL</span></p>
          <p>Faixa: <span className="font-semibold text-slate-700">{analysis?.min ?? 0}–{analysis?.max ?? 0}</span></p>
          <p>Total: <span className="font-semibold text-slate-700">{analysis?.total ?? 0}</span></p>
          <p>In range: <span className="font-semibold text-slate-700">{analysis?.inRangePercent ?? 0}%</span></p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus size={13} /> Registrar</button>
      </div>
      <div className="rounded-xl border border-slate-100 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">Últimas 10 medições</p>
        <GlucoseSparkline values={(data ?? []).slice(0, 10).map((item) => item.value).reverse()} />
      </div>
      {isLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div> : (
        <ul className="space-y-2">
          {(data ?? []).slice(0, 20).map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-100 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-800">{item.value} mg/dL</span>
              <span className="ml-2 text-slate-500">{new Date(item.measuredAt).toLocaleString('pt-BR')}</span>
              {item.notes && <p className="text-xs text-slate-500">Obs: {item.notes}</p>}
            </li>
          ))}
          {(!data || !data.length) && <li className="text-sm text-slate-400">Nenhum registro de glicemia.</li>}
        </ul>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-2xl" onSubmit={(e) => {
            e.preventDefault();
            const parsedValue = parseBrNumber(value);
            if (parsedValue === undefined) return;

            mutate({ patientId, value: parsedValue, measuredAt: new Date().toISOString(), ...(notes ? { notes } : {}) }, { onSuccess: () => { setShowModal(false); setValue(''); setNotes(''); } });
          }}>
            <h3 className="font-semibold text-slate-800">Registrar glicemia</h3>
            <input required type="text" inputMode="decimal" placeholder="mg/dL" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={value} onChange={(e) => setValue(e.target.value)} />
            <textarea placeholder="Observação (opcional)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button>
              <button disabled={isPending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ── Bioimpedance Tab ─────────────────────────────────────────────
const ACCEPTED_BIO_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

type BioFieldSource = 'manual' | 'ia';

type BioimpedanceFormState = {
  measuredAt: string;
  bodyFatPct: string;
  muscleMassKg: string;
  weightKg: string;
};

const BioimpedanceTab = ({ patientId }: { patientId: string }) => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useBioimpedanceEvolutionQuery(patientId);
  const latest: BioimpedancePoint | undefined = data?.at(-1);
  const [showModal, setShowModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Record<string, unknown>>({
    source: 'manual',
    originalFile: null,
    fieldsSource: {},
  });
  const [form, setForm] = useState<BioimpedanceFormState>({
    measuredAt: new Date().toISOString().slice(0, 10),
    bodyFatPct: '',
    muscleMassKg: '',
    weightKg: '',
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof bioimpedanceApi.create>[0]) => bioimpedanceApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bioimpedance', 'evolution', patientId] });
      setShowModal(false);
      setFileError(null);
      setSelectedFileName(null);
      setMetadata({ source: 'manual', originalFile: null, fieldsSource: {} });
      setForm({ measuredAt: new Date().toISOString().slice(0, 10), bodyFatPct: '', muscleMassKg: '', weightKg: '' });
    },
  });

  const extractMutation = useMutation({
    mutationFn: (text: string) => aiApi.extractBioimpedance(text),
    onSuccess: (result) => {
      const extractNumber = (value: unknown): string => {
        if (typeof value === 'number') return String(value);
        if (typeof value === 'string') return value;
        return '';
      };

      const bodyFat = extractNumber((result as Record<string, unknown>)?.bodyFatPct ?? (result as Record<string, unknown>)?.fatMassPercent);
      const muscle = extractNumber((result as Record<string, unknown>)?.muscleMassKg);
      const weight = extractNumber((result as Record<string, unknown>)?.weightKg);
      const measuredAt = typeof (result as Record<string, unknown>)?.measuredAt === 'string'
        ? String((result as Record<string, unknown>)?.measuredAt).slice(0, 10)
        : form.measuredAt;

      const fieldsSource: Record<string, BioFieldSource> = {
        measuredAt: measuredAt ? 'ia' : 'manual',
        bodyFatPct: bodyFat ? 'ia' : 'manual',
        muscleMassKg: muscle ? 'ia' : 'manual',
        weightKg: weight ? 'ia' : 'manual',
      };

      setForm((prev) => ({
        ...prev,
        measuredAt,
        bodyFatPct: bodyFat,
        muscleMassKg: muscle,
        weightKg: weight,
      }));
      setMetadata((prev) => ({
        ...prev,
        source: 'ia',
        fieldsSource,
      }));
    },
    onError: () => {
      setFileError('Não foi possível extrair os dados do exame com IA.');
    },
  });

  const setField = (name: keyof BioimpedanceFormState, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setMetadata((prev) => ({
      ...prev,
      fieldsSource: {
        ...(typeof prev.fieldsSource === 'object' && prev.fieldsSource !== null ? prev.fieldsSource as Record<string, BioFieldSource> : {}),
        [name]: 'manual',
      },
    }));
  };

  const readFileAsTextPayload = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Formato inválido de arquivo.'));
        return;
      }
      if (file.type === 'application/pdf') {
        resolve(reader.result.split(',')[1] ?? reader.result);
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
    reader.readAsDataURL(file);
  });

  const processSelectedFile = async (file: File) => {
    if (!ACCEPTED_BIO_FILE_TYPES.includes(file.type)) {
      setFileError('Tipo de arquivo inválido. Envie JPG, PNG ou PDF.');
      return;
    }

    setFileError(null);
    setSelectedFileName(file.name);
    setMetadata((prev) => ({
      ...prev,
      originalFile: {
        name: file.name,
        type: file.type,
      },
    }));

    try {
      const text = await readFileAsTextPayload(file);
      await extractMutation.mutateAsync(text);
    } catch {
      setFileError('Não foi possível ler o arquivo selecionado.');
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>;

  const fieldsSource = (metadata.fieldsSource as Record<string, BioFieldSource> | undefined) ?? {};

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={() => setShowModal(true)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Novo exame</button>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-100 p-3"><p className="text-xs text-slate-500">Última data</p><p className="text-sm font-semibold text-slate-700">{latest ? new Date(latest.date).toLocaleDateString('pt-BR') : '—'}</p></div>
        <div className="rounded-xl border border-slate-100 p-3"><p className="text-xs text-slate-500">Gordura corporal</p><p className="text-sm font-semibold text-slate-700">{latest?.fatMassPercent ?? 0}%</p></div>
        <div className="rounded-xl border border-slate-100 p-3"><p className="text-xs text-slate-500">Massa muscular</p><p className="text-sm font-semibold text-slate-700">{latest?.muscleMassKg ?? 0} kg</p></div>
      </div>
      <ul className="space-y-2">
        {(data ?? []).slice().reverse().map((item, i) => (
          <li key={i} className="rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-700">
            {new Date(item.date).toLocaleDateString('pt-BR')} · Gordura {item.fatMassPercent}% · Massa muscular {item.muscleMassKg} kg
          </li>
        ))}
        {(!data || !data.length) && <li className="text-sm text-slate-400">Nenhum exame de bioimpedância.</li>}
      </ul>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl" onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              patientId,
              measuredAt: new Date(`${form.measuredAt}T00:00:00`).toISOString(),
              bodyFatPct: Number(form.bodyFatPct) || 0,
              muscleMassKg: Number(form.muscleMassKg) || 0,
              weightKg: form.weightKg ? Number(form.weightKg) : null,
              metadata,
            });
          }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Registrar bioimpedância</h3>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-3 py-2 text-sm">Fechar</button>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-700">Upload de Exame</p>
              <div
                className={`rounded-lg border-2 border-dashed p-5 text-center text-sm ${isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void processSelectedFile(file);
                }}
              >
                <p className="text-slate-600">Arraste e solte JPG, PNG ou PDF aqui</p>
                <button type="button" className="mt-2 rounded-lg border px-3 py-2" onClick={() => fileInputRef.current?.click()}>Selecionar arquivo</button>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void processSelectedFile(file);
                    e.target.value = '';
                  }}
                />
                {selectedFileName && <p className="mt-2 text-xs text-slate-500">Arquivo: {selectedFileName}</p>}
                {extractMutation.isPending && <p className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600"><Loader2 size={12} className="animate-spin" /> Extraindo dados com IA...</p>}
                {fileError && <p className="mt-2 text-xs text-rose-600">{fileError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">Data medição {fieldsSource.measuredAt === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.measuredAt} onChange={(e) => setField('measuredAt', e.target.value)} />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">Gordura corporal (%) {fieldsSource.bodyFatPct === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="number" step="0.1" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.bodyFatPct} onChange={(e) => setField('bodyFatPct', e.target.value)} />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">Massa muscular (kg) {fieldsSource.muscleMassKg === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="number" step="0.1" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.muscleMassKg} onChange={(e) => setField('muscleMassKg', e.target.value)} />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">Peso (kg) {fieldsSource.weightKg === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="number" step="0.1" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.weightKg} onChange={(e) => setField('weightKg', e.target.value)} />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button>
              <button disabled={createMutation.isPending || extractMutation.isPending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

type Tab = 'dados' | 'consultas' | 'exames' | 'glicemia' | 'bioimpedancia' | 'documentos';

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'dados', label: 'Dados', icon: <User size={14} /> },
  { id: 'consultas', label: 'Consultas', icon: <Stethoscope size={14} /> },
  { id: 'exames', label: 'Exames', icon: <FileText size={14} /> },
  { id: 'glicemia', label: 'Glicemia', icon: <Activity size={14} /> },
  { id: 'bioimpedancia', label: 'Bioimpedância', icon: <Calendar size={14} /> },
  { id: 'documentos', label: 'Documentos', icon: <FileText size={14} /> },
];

export const PatientProfilePage = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const [tab, setTab] = useState<Tab>('dados');
  const [showEdit, setShowEdit] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientApi.detail(patientId!),
    enabled: !!patientId,
  });

  const { data: latestScores } = useQuery({
    queryKey: ['scores', 'latest', patientId],
    queryFn: () => scoresApi.latest(patientId!),
    enabled: !!patientId,
  });

  const formatMetric = (value?: string | number | null, interpretation?: string | null) => ({
    value: value === null || value === undefined || value === '' ? '—' : String(value),
    interpretation: interpretation && interpretation.trim() ? interpretation : '—',
  });

  const calculatedIndexes = [
    {
      label: 'HOMA-IR',
      ...formatMetric(latestScores?.homaIr?.value, latestScores?.homaIr?.interpretation),
    },
    {
      label: 'IMC',
      ...formatMetric(latestScores?.imc?.value, latestScores?.imc?.interpretation),
    },
    {
      label: 'HbA1c estimada',
      ...formatMetric(latestScores?.estimatedHba1c?.value, latestScores?.estimatedHba1c?.interpretation),
    },
  ];

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-slate-400" />
    </div>
  );
  if (isError || !data) return (
    <div className="p-6 text-center text-sm text-rose-600">Paciente não encontrado.</div>
  );

  const age = calcAge(data.birthDate);

  return (
    <div className="p-6 space-y-5" data-testid="patient-profile">
      {/* Header card */}
      <div className="flex items-center gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 text-xl font-bold text-white">
          {data.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 truncate">{data.fullName}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {age !== null && `${age} anos`}
            {age !== null && data.sex && ' · '}
            {data.sex && SEX_LABEL[data.sex]}
            {data.cpf && ` · CPF: ${data.cpf}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowEdit(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          data-testid="edit-patient-btn"
        >
          <Edit2 size={14} /> Editar
        </button>
      </div>

      {/* Quick info strip */}
      <div className="flex flex-wrap gap-3">
        {data.phone && (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            <Phone size={11} /> {data.phone}
          </span>
        )}
        {data.email && (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            <Mail size={11} /> {data.email}
          </span>
        )}
        {data.address && (
          <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
            <MapPin size={11} /> {data.address}
          </span>
        )}
        {data.lifecycle && (
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${data.lifecycle === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {data.lifecycle === 'ACTIVE' ? 'Ativo' : data.lifecycle}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            data-testid={`tab-${t.id}`}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition
              ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm min-h-48">
        {tab === 'dados' && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Dados cadastrais</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Nome completo', data.fullName],
                ['Data de nascimento', data.birthDate ? new Date(data.birthDate).toLocaleDateString('pt-BR') : '—'],
                ['Idade', age !== null ? `${age} anos` : '—'],
                ['Sexo', data.sex ? SEX_LABEL[data.sex] : '—'],
                ['CPF', data.cpf ?? '—'],
                ['Telefone', data.phone ?? '—'],
                ['E-mail', data.email ?? '—'],
                ['Endereço', data.address ?? '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
                  <p className="text-slate-700">{value || '—'}</p>
                </div>
              ))}
            </div>
            {data.notes && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium mb-1">Observações</p>
                <p className="text-sm text-slate-700 leading-relaxed">{data.notes}</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-700">Índices Calculados</h3>
                <button
                  type="button"
                  onClick={() => navigate(`/escores?patientId=${data.id}`)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Recalcular
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {calculatedIndexes.map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-100 p-3">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-base font-semibold text-slate-700">{item.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.interpretation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'consultas' && <ConsultationsTab patientId={patientId!} />}

        {tab === 'exames' && <ExamsTab patientId={patientId!} />}

        {tab === 'glicemia' && <GlucoseTab patientId={patientId!} />}

        {tab === 'bioimpedancia' && <BioimpedanceTab patientId={patientId!} />}


        {tab === 'documentos' && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <FileText size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Documentos e arquivos aparecerão aqui.</p>
          </div>
        )}
      </div>

      {showEdit && <EditPatientModal patient={data} onClose={() => setShowEdit(false)} />}
    </div>
  );
};

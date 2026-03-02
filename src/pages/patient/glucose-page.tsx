import { FormEvent, useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api/http';

interface GlucoseItem {
  id: string;
  value: number;
  measuredAt: string;
  notes?: string | null;
}

interface GlucoseAnalysis {
  timeInRange?: number;
  average?: number;
  estimatedA1c?: number;
  insight?: string;
}

const glucoseKey = (patientId: string) => ['patient-portal', patientId, 'glucose'] as const;
const glucoseAnalysisKey = (patientId: string) => ['patient-portal', patientId, 'glucose-analysis'] as const;

const getSemaphore = (value: number) => {
  if (value < 70) return { label: 'Baixa', className: 'bg-rose-100 text-rose-800 border-rose-300' };
  if (value <= 180) return { label: 'Alvo', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  return { label: 'Alta', className: 'bg-amber-100 text-amber-800 border-amber-300' };
};

const toLocalDate = (input: string) => new Date(input).toLocaleString('pt-BR');

export const GlucosePage = () => {
  const patient = usePatientAuthStore((state) => state.patient);
  const patientId = patient?.patientId;
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState('');

  const glucoseQuery = useQuery({
    queryKey: glucoseKey(patientId ?? 'unknown'),
    enabled: Boolean(patientId),
    queryFn: async () => {
      const { data } = await http.get(`/patient-portal/${patientId}/glucose`);
      if (Array.isArray(data)) return data as GlucoseItem[];
      if (Array.isArray(data?.items)) return data.items as GlucoseItem[];
      return [] as GlucoseItem[];
    },
  });

  const analysisQuery = useQuery({
    queryKey: glucoseAnalysisKey(patientId ?? 'unknown'),
    enabled: Boolean(patientId),
    queryFn: async () => {
      const { data } = await http.get(`/patient-portal/${patientId}/glucose/analysis`);
      return (data ?? {}) as GlucoseAnalysis;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { value: number; notes?: string; measuredAt?: string }) => {
      if (!patientId) throw new Error('patientId ausente');
      const { data } = await http.post(`/patient-portal/${patientId}/glucose`, {
        ...payload,
        measuredAt: payload.measuredAt ?? new Date().toISOString(),
      });
      return data;
    },
    onSuccess: async () => {
      if (!patientId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: glucoseKey(patientId) }),
        queryClient.invalidateQueries({ queryKey: glucoseAnalysisKey(patientId) }),
      ]);
    },
  });

  const sortedEntries = useMemo(
    () => [...(glucoseQuery.data ?? [])].sort((a, b) => +new Date(b.measuredAt) - +new Date(a.measuredAt)),
    [glucoseQuery.data],
  );

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(value);
    if (!parsed) return;

    try {
      await createMutation.mutateAsync({ value: parsed, notes });
      setFeedback('Registro salvo com sucesso.');
      setValue('');
      setNotes('');
      setIsModalOpen(false);
    } catch {
      setFeedback('Não foi possível registrar agora. Tente novamente.');
    }
  };

  if (!patientId) {
    return (
      <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">
        Não encontramos seu identificador de paciente. Faça login novamente para carregar seus dados de glicemia.
      </section>
    );
  }

  if (glucoseQuery.isLoading || analysisQuery.isLoading) {
    return (
      <section className="flex items-center justify-center py-8 text-slate-600">
        <Loader2 className="mr-2 animate-spin" size={18} /> Carregando informações de glicemia...
      </section>
    );
  }

  const analysis = analysisQuery.data;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Glicemia</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-10 items-center gap-1 rounded-xl bg-blue-800 px-3 text-sm font-bold text-white"
        >
          <Plus size={14} /> Registrar
        </button>
      </div>

      {feedback && <p className="rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700">{feedback}</p>}

      <div className="grid grid-cols-2 gap-3">
        <article className="rounded-xl border-2 border-blue-200 bg-white p-3">
          <p className="text-sm text-slate-600">Média</p>
          <p className="text-xl font-bold text-slate-900">{analysis?.average ?? '--'} mg/dL</p>
        </article>
        <article className="rounded-xl border-2 border-blue-200 bg-white p-3">
          <p className="text-sm text-slate-600">A1c estimada</p>
          <p className="text-xl font-bold text-slate-900">{analysis?.estimatedA1c ?? '--'}%</p>
        </article>
      </div>

      <article className="rounded-2xl border-2 border-slate-300 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">Análise</p>
        <p className="text-base text-slate-900">{analysis?.insight ?? 'Sem análise disponível no momento.'}</p>
      </article>

      <ul className="space-y-2">
        {sortedEntries.map((entry: GlucoseItem) => {
          const semaphore = getSemaphore(entry.value);
          return (
            <li key={entry.id} className="rounded-2xl border-2 border-slate-300 bg-white p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-bold text-slate-900">{entry.value} mg/dL</p>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${semaphore.className}`}>
                  {semaphore.label}
                </span>
              </div>
              <p className="text-sm text-slate-700">{toLocalDate(entry.measuredAt)}</p>
              {entry.notes && <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>}
            </li>
          );
        })}
        {!sortedEntries.length && <li className="text-sm text-slate-600">Nenhum registro encontrado.</li>}
      </ul>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Novo registro de glicemia</h2>
            <form className="mt-3 space-y-3" onSubmit={handleCreate}>
              <input
                type="number"
                min={1}
                required
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Valor em mg/dL"
                className="h-12 w-full rounded-xl border-2 border-slate-300 px-3"
              />
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observações (opcional)"
                className="min-h-24 w-full rounded-xl border-2 border-slate-300 p-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 flex-1 rounded-xl border-2 border-slate-300 bg-white font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="h-11 flex-1 rounded-xl bg-blue-800 font-bold text-white disabled:opacity-60"
                >
                  {createMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Salvando...
                    </span>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

import { useState, useRef } from 'react';
import { Loader2, Plus, Sparkles, Upload } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useLabResultsQuery } from '@/features/lab-results/use-lab-results-query';
import { useCreateLabResultMutation } from '@/features/lab-results/use-create-lab-result-mutation';
import { labResultsApi } from '@/lib/api/lab-results-api';
import type { CreateLabResultDto } from '@/types/clinical-modules';
import { parseBrNumber } from '@/lib/utils/parse-br-number';

// ── Exam logic from patient-profile-page.tsx ──────────────────────
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

export const PatientExamsTab = ({ patientId }: { patientId: string }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateLabResultDto>({ patientId, examName: '', value: 0, unit: '', reference: '', resultDate: new Date().toISOString().slice(0, 10) });
  const [valueInput, setValueInput] = useState('');
  const { data, isLoading } = useLabResultsQuery(patientId);
  const { mutate, isPending } = useCreateLabResultMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeMutation = useMutation({
    mutationFn: (file: File) => labResultsApi.analyze(file),
    onSuccess: (data) => {
      if (data.tests && data.tests.length > 0) {
        const test = data.tests[0];
        setForm(prev => ({
          ...prev,
          examName: test.testName || prev.examName,
          value: typeof test.resultValue === 'number' ? test.resultValue : parseFloat(test.resultValue) || 0,
          unit: test.unit || prev.unit,
          reference: test.referenceRange || prev.reference,
          resultDate: data.labReport?.reportDate ? new Date(data.labReport.reportDate).toISOString() : prev.resultDate
        }));
        setValueInput(String(test.resultValue || ''));
      }
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeMutation.mutate(file);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseBrNumber(valueInput);
    if (parsedValue === undefined) return;

    mutate({ ...form, patientId, value: parsedValue, resultDate: new Date(form.resultDate).toISOString(), ...(form.unit ? { unit: form.unit } : {}), ...(form.reference ? { reference: form.reference } : {}) }, {
      onSuccess: () => {
        setShowModal(false);
        setValueInput('');
        setForm({ patientId, examName: '', value: 0, unit: '', reference: '', resultDate: new Date().toISOString().slice(0, 10) });
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-800">Adicionar exame</h3>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzeMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                {analyzeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {analyzeMutation.isPending ? 'Analisando...' : 'Preencher com IA'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            
            <input required placeholder="Nome do exame" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.examName} onChange={(e) => setForm((p) => ({ ...p, examName: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input required type="text" inputMode="decimal" placeholder="Valor" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={valueInput} onChange={(e) => setValueInput(e.target.value)} />
              <input placeholder="Unidade" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.unit || ''} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
              <input placeholder="Referência (ex: 70-99)" className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.reference || ''} onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} />
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
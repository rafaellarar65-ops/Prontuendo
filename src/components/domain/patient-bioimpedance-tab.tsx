import { useState, useRef } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Loader2, Plus, X } from 'lucide-react';
import { useBioimpedanceEvolutionQuery } from '@/features/bioimpedance/use-bioimpedance-evolution-query';
import { useCreateBioimpedanceMutation } from '@/features/bioimpedance/use-create-bioimpedance-mutation';
import { mapBioimpedanceAiToFormValues, mapBioimpedanceFormToCreatePayload } from '@/lib/api/bioimpedance-api';
import { aiApi } from '@/lib/api/ai-api';
import type { BioimpedanceAiExtractionResponse, BioimpedanceDraftMetadata, BioimpedancePoint } from '@/types/bioimpedance';
import type { Patient } from '@/types/api';

const ACCEPTED_BIO_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

type BioFieldSource = 'manual' | 'ia';

type BioimpedanceFormState = {
  measuredAt: string;
  weightKg: string;
  bodyFatPct: string;
  muscleMassKg: string;
  bodyWaterPct: string;
  visceralFatLevel: string;
  basalMetabolicRateKcal: string;
  boneMassKg: string;
  imc: string;
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'));
    if (Number.isFinite(normalized)) return normalized;
  }
  return undefined;
};

const resolveHeightMeters = (patient: Patient): number | null => {
  const profile = patient as unknown as Record<string, unknown>;
  const rawHeight =
    toNumberOrUndefined(profile.heightM)
    ?? toNumberOrUndefined(profile.height)
    ?? toNumberOrUndefined(profile.heightCm)
    ?? toNumberOrUndefined((profile.anthropometry as Record<string, unknown> | undefined)?.heightM)
    ?? toNumberOrUndefined((profile.anthropometry as Record<string, unknown> | undefined)?.heightCm);

  if (!rawHeight) return null;
  return rawHeight > 3 ? rawHeight / 100 : rawHeight;
};

export const PatientBioimpedanceTab = ({ patientId, patient }: { patientId: string; patient: Patient }) => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useBioimpedanceEvolutionQuery(patientId);
  const heightInMeters = resolveHeightMeters(patient);
  const latest: BioimpedancePoint | undefined = data?.at(-1);
  const [showModal, setShowModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<BioimpedanceDraftMetadata>({
    source: 'manual',
    originalFile: null,
    fieldsSource: {},
  });
  const [form, setForm] = useState<BioimpedanceFormState>({
    measuredAt: new Date().toISOString().slice(0, 10),
    weightKg: '',
    bodyFatPct: '',
    muscleMassKg: '',
    bodyWaterPct: '',
    visceralFatLevel: '',
    basalMetabolicRateKcal: '',
    boneMassKg: '',
    imc: '',
  });

  const createMutation = useCreateBioimpedanceMutation();

  const extractMutation = useMutation({
    mutationFn: (text: string) => aiApi.extractBioimpedance(text),
    onSuccess: (result) => {
      const parsed = mapBioimpedanceAiToFormValues(result as BioimpedanceAiExtractionResponse);
      const weight = parsed.weightKg !== undefined && parsed.weightKg !== null ? String(parsed.weightKg) : '';
      const imc = parsed.bmi !== undefined && parsed.bmi !== null ? String(parsed.bmi) : '';
      const fieldsSource: Record<string, BioFieldSource> = {
        measuredAt: parsed.measuredAt ? 'ia' : 'manual',
        bodyFatPct: parsed.bodyFatPct !== undefined && parsed.bodyFatPct !== null ? 'ia' : 'manual',
        muscleMassKg: parsed.muscleMassKg !== undefined && parsed.muscleMassKg !== null ? 'ia' : 'manual',
        weightKg: parsed.weightKg !== undefined && parsed.weightKg !== null ? 'ia' : 'manual',
        bodyWaterPct: (parsed as Record<string, unknown>).hydrationPct !== undefined ? 'ia' : 'manual',
        visceralFatLevel: (parsed as Record<string, unknown>).visceralFatLevel !== undefined ? 'ia' : 'manual',
        basalMetabolicRateKcal: (parsed as Record<string, unknown>).basalMetabolicRateKcal !== undefined ? 'ia' : 'manual',
        boneMassKg: (parsed as Record<string, unknown>).boneMassKg !== undefined ? 'ia' : 'manual',
        imc: parsed.bmi !== undefined && parsed.bmi !== null ? 'ia' : 'manual',
      };

      const derivedImc = heightInMeters && weight
        ? (Number(weight.replace(',', '.')) / (heightInMeters * heightInMeters)).toFixed(2)
        : imc;

      setForm((prev) => ({
        ...prev,
        measuredAt: parsed.measuredAt ? parsed.measuredAt.slice(0, 10) : form.measuredAt,
        weightKg: weight,
        bodyFatPct: parsed.bodyFatPct !== undefined && parsed.bodyFatPct !== null ? String(parsed.bodyFatPct) : '',
        muscleMassKg: parsed.muscleMassKg !== undefined && parsed.muscleMassKg !== null ? String(parsed.muscleMassKg) : '',
        bodyWaterPct: (parsed as Record<string, unknown>).hydrationPct !== undefined ? String((parsed as Record<string, unknown>).hydrationPct) : '',
        visceralFatLevel: (parsed as Record<string, unknown>).visceralFatLevel !== undefined ? String((parsed as Record<string, unknown>).visceralFatLevel) : '',
        basalMetabolicRateKcal: (parsed as Record<string, unknown>).basalMetabolicRateKcal !== undefined ? String((parsed as Record<string, unknown>).basalMetabolicRateKcal) : '',
        boneMassKg: (parsed as Record<string, unknown>).boneMassKg !== undefined ? String((parsed as Record<string, unknown>).boneMassKg) : '',
        imc: derivedImc,
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
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'weightKg') {
        const parsedWeight = Number(value.replace(',', '.'));
        if (heightInMeters && Number.isFinite(parsedWeight) && parsedWeight > 0) {
          next.imc = (parsedWeight / (heightInMeters * heightInMeters)).toFixed(2);
        } else if (heightInMeters) {
          next.imc = '';
        }
      }
      return next;
    });
    setMetadata((prev) => ({
      ...prev,
      fieldsSource: {
        ...prev.fieldsSource,
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
      originalFileName: file.name,
    }));

    try {
      const text = await readFileAsTextPayload(file);
      await extractMutation.mutateAsync(text);
    } catch {
      setFileError('Não foi possível ler o arquivo selecionado.');
    }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-400" /></div>;

  const fieldsSource = metadata.fieldsSource;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <p>Total de exames: <span className="font-semibold text-slate-700">{data?.length ?? 0}</span></p>
          <p>Último registro: <span className="font-semibold text-slate-700">{latest ? new Date(latest.date).toLocaleDateString('pt-BR') : '—'}</span></p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus size={13} />
          Novo exame
        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <form className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-5 shadow-2xl" onSubmit={(e) => {
            e.preventDefault();
            if (createMutation.isPending) return;
            createMutation.mutate(mapBioimpedanceFormToCreatePayload(patientId, {
              measuredAt: new Date(`${form.measuredAt}T00:00:00`).toISOString(),
              source: metadata.source,
              bodyFatPct: Number(form.bodyFatPct) || 0,
              muscleMassKg: Number(form.muscleMassKg) || 0,
              weightKg: form.weightKg ? Number(form.weightKg) : null,
              hydrationPct: form.bodyWaterPct ? Number(form.bodyWaterPct) : null,
              visceralFatLevel: form.visceralFatLevel ? Number(form.visceralFatLevel) : null,
              basalMetabolicRateKcal: form.basalMetabolicRateKcal ? Number(form.basalMetabolicRateKcal) : null,
              bmi: form.imc ? Number(form.imc) : null,
              ...(metadata.segmentedFields ? { segmentedFields: metadata.segmentedFields } : {}),
              ...(metadata.originalFileName ? { originalFileName: metadata.originalFileName } : {}),
              ...(metadata.originalFileUrl ? { originalFileUrl: metadata.originalFileUrl } : {}),
              boneMassKg: form.boneMassKg ? Number(form.boneMassKg) : null,
            }), {
              onSuccess: () => {
                setShowModal(false);
                setFileError(null);
                setSelectedFileName(null);
                setMetadata({ source: 'manual', originalFile: null, fieldsSource: {} });
                setForm({
                  measuredAt: new Date().toISOString().slice(0, 10),
                  weightKg: '',
                  bodyFatPct: '',
                  muscleMassKg: '',
                  bodyWaterPct: '',
                  visceralFatLevel: '',
                  basalMetabolicRateKcal: '',
                  boneMassKg: '',
                  imc: '',
                });
              },
            });
          }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Registrar bioimpedância</h3>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
                <X size={16} />
              </button>
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
                <input required type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.measuredAt} onChange={(e) => setField('measuredAt', e.target.value)} />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">Peso (kg) {fieldsSource.weightKg === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="number" step="0.1" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.weightKg} onChange={(e) => setField('weightKg', e.target.value)} />
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
                <span className="inline-flex items-center gap-2">Água corporal (%) {fieldsSource.bodyWaterPct === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="number" step="0.1" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.bodyWaterPct} onChange={(e) => setField('bodyWaterPct', e.target.value)} />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">Gordura visceral (nível) {fieldsSource.visceralFatLevel === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="number" step="0.1" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.visceralFatLevel} onChange={(e) => setField('visceralFatLevel', e.target.value)} />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">Taxa metabólica basal (kcal) {fieldsSource.basalMetabolicRateKcal === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="number" step="1" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.basalMetabolicRateKcal} onChange={(e) => setField('basalMetabolicRateKcal', e.target.value)} />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span className="inline-flex items-center gap-2">Massa óssea (kg) {fieldsSource.boneMassKg === 'ia' && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-700">Extraído por IA</span>}</span>
                <input type="number" step="0.1" className="w-full rounded-lg border border-slate-200 px-3 py-2" value={form.boneMassKg} onChange={(e) => setField('boneMassKg', e.target.value)} />
              </label>
              <label className="space-y-1 text-sm text-slate-700">
                <span>IMC {heightInMeters ? <span className="text-xs text-slate-400">(calculado automaticamente)</span> : <span className="text-xs text-slate-400">(altura não disponível no perfil)</span>}</span>
                <input
                  type="number"
                  step="0.01"
                  disabled={!heightInMeters}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:cursor-not-allowed disabled:bg-slate-100"
                  value={heightInMeters ? form.imc : ''}
                  readOnly
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending || extractMutation.isPending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
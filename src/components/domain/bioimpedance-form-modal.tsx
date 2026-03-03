import type { FormEvent } from 'react';
import { X } from 'lucide-react';

export interface BioimpedanceFormValues {
  measuredAt: string;
  weightKg: string;
  bodyFatPct: string;
  muscleMassKg: string;
  bodyWaterPct: string;
  visceralFatLevel: string;
  basalMetabolicRateKcal: string;
  boneMassKg: string;
  imc: string;
}

interface BioimpedanceFormModalProps {
  form: BioimpedanceFormValues;
  onChange: (field: keyof BioimpedanceFormValues, value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  hasHeight: boolean;
}

const FIELD_INPUT_CLASSNAME = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';

export const BioimpedanceFormModal = ({
  form,
  onChange,
  onClose,
  onSubmit,
  isPending,
  hasHeight,
}: BioimpedanceFormModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h3 className="font-semibold text-slate-800">Registrar bioimpedância</h3>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <X size={16} />
        </button>
      </div>
      <form className="space-y-4 px-6 py-5" onSubmit={onSubmit}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Data da medição *</label>
            <input required type="date" value={form.measuredAt} onChange={(event) => onChange('measuredAt', event.target.value)} className={FIELD_INPUT_CLASSNAME} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Peso (kg)</label>
            <input type="number" step="0.01" min="0" value={form.weightKg} onChange={(event) => onChange('weightKg', event.target.value)} className={FIELD_INPUT_CLASSNAME} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Gordura corporal (%)</label>
            <input type="number" step="0.01" min="0" value={form.bodyFatPct} onChange={(event) => onChange('bodyFatPct', event.target.value)} className={FIELD_INPUT_CLASSNAME} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Massa muscular (kg)</label>
            <input type="number" step="0.01" min="0" value={form.muscleMassKg} onChange={(event) => onChange('muscleMassKg', event.target.value)} className={FIELD_INPUT_CLASSNAME} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Água corporal (%)</label>
            <input type="number" step="0.01" min="0" value={form.bodyWaterPct} onChange={(event) => onChange('bodyWaterPct', event.target.value)} className={FIELD_INPUT_CLASSNAME} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nível de gordura visceral</label>
            <input type="number" step="0.1" min="0" value={form.visceralFatLevel} onChange={(event) => onChange('visceralFatLevel', event.target.value)} className={FIELD_INPUT_CLASSNAME} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Taxa metabólica basal (kcal)</label>
            <input type="number" step="1" min="0" value={form.basalMetabolicRateKcal} onChange={(event) => onChange('basalMetabolicRateKcal', event.target.value)} className={FIELD_INPUT_CLASSNAME} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Massa óssea (kg)</label>
            <input type="number" step="0.01" min="0" value={form.boneMassKg} onChange={(event) => onChange('boneMassKg', event.target.value)} className={FIELD_INPUT_CLASSNAME} />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">IMC (calculado)</label>
            <input type="text" value={form.imc} disabled className={`${FIELD_INPUT_CLASSNAME} disabled:bg-slate-50 disabled:text-slate-500`} placeholder={hasHeight ? 'Calculado automaticamente pelo peso e altura do paciente' : 'Altura do paciente indisponível'} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600" disabled={isPending}>Cancelar</button>
          <button type="submit" disabled={isPending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { http } from '@/lib/api/http';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';

interface QuestionnaireForm {
  symptoms: string;
  medicationAdherence: string;
  hypoglycemiaSignals: string;
  sleepQuality: string;
  stressLevel: string;
}

const initialForm: QuestionnaireForm = {
  symptoms: '',
  medicationAdherence: '',
  hypoglycemiaSignals: '',
  sleepQuality: '',
  stressLevel: '',
};

export const QuestionnairePage = () => {
  const patient = usePatientAuthStore((state) => state.patient);
  const patientId = patient?.patientId;

  const [form, setForm] = useState<QuestionnaireForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patientId) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      await http.post(`/patient-portal/${patientId}/questionnaire`, form);
      setMessage('Respostas enviadas com sucesso. Obrigado!');
      setForm(initialForm);
    } catch {
      setMessage('Não foi possível enviar agora. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!patientId) {
    return (
      <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">
        Não encontramos seu identificador de paciente para enviar o questionário. Faça login novamente.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Questionário pré-consulta</h1>

      <form className="space-y-3 rounded-2xl border-2 border-slate-300 bg-white p-4" onSubmit={onSubmit}>
        <label htmlFor="symptoms" className="block text-base font-semibold text-slate-900">
          Como você se sentiu nos últimos 7 dias?
        </label>
        <textarea
          id="symptoms"
          required
          value={form.symptoms}
          onChange={(event) => setForm((current) => ({ ...current, symptoms: event.target.value }))}
          className="min-h-28 w-full rounded-xl border-2 border-slate-400 p-3 text-base"
        />

        <label htmlFor="medication" className="block text-base font-semibold text-slate-900">
          Teve dificuldade para tomar os remédios?
        </label>
        <select
          id="medication"
          required
          value={form.medicationAdherence}
          onChange={(event) => setForm((current) => ({ ...current, medicationAdherence: event.target.value }))}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base"
        >
          <option value="">Selecione</option>
          <option value="nao">Não</option>
          <option value="as-vezes">Às vezes</option>
          <option value="sim">Sim</option>
        </select>

        <label htmlFor="hypo" className="block text-base font-semibold text-slate-900">
          Teve sinais de hipoglicemia?
        </label>
        <select
          id="hypo"
          required
          value={form.hypoglycemiaSignals}
          onChange={(event) => setForm((current) => ({ ...current, hypoglycemiaSignals: event.target.value }))}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base"
        >
          <option value="">Selecione</option>
          <option value="nao">Não</option>
          <option value="sim">Sim</option>
        </select>

        <label htmlFor="sleep" className="block text-base font-semibold text-slate-900">
          Como foi seu sono?
        </label>
        <select
          id="sleep"
          required
          value={form.sleepQuality}
          onChange={(event) => setForm((current) => ({ ...current, sleepQuality: event.target.value }))}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base"
        >
          <option value="">Selecione</option>
          <option value="bom">Bom</option>
          <option value="regular">Regular</option>
          <option value="ruim">Ruim</option>
        </select>

        <label htmlFor="stress" className="block text-base font-semibold text-slate-900">
          Nível de estresse na semana
        </label>
        <select
          id="stress"
          required
          value={form.stressLevel}
          onChange={(event) => setForm((current) => ({ ...current, stressLevel: event.target.value }))}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base"
        >
          <option value="">Selecione</option>
          <option value="baixo">Baixo</option>
          <option value="medio">Médio</option>
          <option value="alto">Alto</option>
        </select>

        <button
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-800 text-base font-bold text-white disabled:opacity-60"
        >
          {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> Enviando...</> : 'Enviar respostas'}
        </button>
      </form>

      {message && (
        <p className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 text-base text-slate-900">{message}</p>
      )}
    </section>
  );
};

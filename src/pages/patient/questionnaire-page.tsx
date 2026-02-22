import { FormEvent, useState } from 'react';

export const QuestionnairePage = () => {
  const [saved, setSaved] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Questionário pré-consulta</h1>

      <form className="space-y-3 rounded-2xl border-2 border-slate-300 bg-white p-4" onSubmit={onSubmit}>
        <label htmlFor="symptoms" className="block text-base font-semibold text-slate-900">
          Como você se sentiu nos últimos 7 dias?
        </label>
        <textarea id="symptoms" required className="min-h-28 w-full rounded-xl border-2 border-slate-400 p-3 text-base" />

        <label htmlFor="medication" className="block text-base font-semibold text-slate-900">
          Teve dificuldade para tomar os remédios?
        </label>
        <select id="medication" required className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base">
          <option value="">Selecione</option>
          <option value="nao">Não</option>
          <option value="as-vezes">Às vezes</option>
          <option value="sim">Sim</option>
        </select>

        <label htmlFor="hypo" className="block text-base font-semibold text-slate-900">
          Teve sinais de hipoglicemia?
        </label>
        <select id="hypo" required className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base">
          <option value="">Selecione</option>
          <option value="nao">Não</option>
          <option value="sim">Sim</option>
        </select>

        <button className="h-12 w-full rounded-xl bg-blue-800 text-base font-bold text-white">Enviar respostas</button>
      </form>

      {saved && (
        <p className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 text-base text-slate-900">
          Respostas enviadas com sucesso. Obrigado!
        </p>
      )}
    </section>
  );
};

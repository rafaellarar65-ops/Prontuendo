import { Link } from 'react-router-dom';

export const HomePage = () => (
  <section className="space-y-4">
    <h1 className="text-2xl font-bold text-slate-900">Olá, Maria 👋</h1>

    <article className="rounded-2xl border-2 border-blue-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">Próxima consulta</p>
      <p className="mt-1 text-xl font-bold text-blue-900">18/11 às 14:30</p>
      <p className="text-base text-slate-800">Dr. Rafael Lara · Endocrinologia</p>
    </article>

    <article className="rounded-2xl border-2 border-emerald-300 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">Última glicemia</p>
      <p className="mt-1 text-xl font-bold text-emerald-800">112 mg/dL (hoje 07:20)</p>
      <p className="text-base text-slate-800">Dentro da faixa combinada com o médico.</p>
    </article>

    <article className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
      <p className="text-base font-bold text-slate-900">Alerta do médico</p>
      <p className="mt-1 text-base text-slate-800">Não esquecer exame de sangue em jejum na sexta.</p>
    </article>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Link
        to="/questionario"
        className="flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-400 bg-white p-3 text-center text-base font-semibold text-slate-900"
      >
        Questionário pré-consulta
      </Link>
      <Link
        to="/glicemia"
        className="flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-400 bg-white p-3 text-center text-base font-semibold text-slate-900"
      >
        Registrar glicemia agora
      </Link>
      <Link
        to="/exames"
        className="flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-400 bg-white p-3 text-center text-base font-semibold text-slate-900"
      >
        Enviar novo exame
      </Link>
      <Link
        to="/documentos"
        className="flex min-h-11 items-center justify-center rounded-xl border-2 border-slate-400 bg-white p-3 text-center text-base font-semibold text-slate-900"
      >
        Ver meus documentos
      </Link>
    </div>
  </section>
);

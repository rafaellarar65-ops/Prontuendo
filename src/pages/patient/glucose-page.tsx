import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { addGlucoseEntry, GlucoseEntry, loadGlucoseEntries, markAllAsSynced } from '@/lib/offline/glucose-sync';

type Period = 7 | 14 | 30;

const calculateAverage = (entries: GlucoseEntry[]) => {
  if (!entries.length) return 0;
  return Math.round(entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length);
};

const getEstimatedA1c = (avgGlucose: number) => {
  if (!avgGlucose) return '--';
  const a1c = (avgGlucose + 46.7) / 28.7;
  return a1c.toFixed(1);
};

const toLocalDate = (input: string) => new Date(input).toLocaleString('pt-BR');

export const GlucosePage = () => {
  const [entries, setEntries] = useState<GlucoseEntry[]>([]);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [period, setPeriod] = useState<Period>(7);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    setEntries(loadGlucoseEntries());

    const onBackOnline = () => {
      markAllAsSynced();
      setEntries(loadGlucoseEntries());
      setMessage('Internet voltou. Seus registros foram sincronizados.');
    };

    window.addEventListener('online', onBackOnline);
    return () => window.removeEventListener('online', onBackOnline);
  }, []);

  const visibleEntries = useMemo(() => {
    const cutoff = Date.now() - period * 24 * 60 * 60 * 1000;
    return entries.filter((entry) => new Date(entry.measuredAt).getTime() >= cutoff);
  }, [entries, period]);

  const timeInRange = useMemo(() => {
    if (!visibleEntries.length) return 0;
    const inRange = visibleEntries.filter((entry) => entry.value >= 70 && entry.value <= 180).length;
    return Math.round((inRange / visibleEntries.length) * 100);
  }, [visibleEntries]);

  const average = useMemo(() => calculateAverage(visibleEntries), [visibleEntries]);

  const onPhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(typeof reader.result === 'string' ? reader.result : undefined);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedValue = Number(value);
    if (parsedValue <= 0) return;

    addGlucoseEntry({
      id: crypto.randomUUID(),
      value: parsedValue,
      measuredAt: new Date().toISOString(),
      note,
      photoDataUrl,
    });

    setEntries(loadGlucoseEntries());
    setValue('');
    setNote('');
    setPhotoDataUrl(undefined);
    setMessage(
      navigator.onLine
        ? 'Registro salvo no portal.'
        : 'Registro salvo no celular. Vamos sincronizar quando voltar internet.',
    );
  };

  const aiMessage =
    timeInRange >= 70
      ? 'Ótimo progresso! Continue com seus horários e hidratação.'
      : 'Atenção: houve oscilação nesta semana. Vale registrar refeições e conversar com a médica.';

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Glicemia</h1>

      <form className="space-y-3 rounded-2xl border-2 border-slate-300 bg-white p-4" onSubmit={onSubmit}>
        <label className="text-base font-semibold text-slate-900" htmlFor="value">
          Valor (mg/dL)
        </label>
        <input
          id="value"
          type="number"
          inputMode="numeric"
          required
          min={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base"
        />

        <label className="text-base font-semibold text-slate-900" htmlFor="photo">
          Foto do glicosímetro (opcional)
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPhotoChange}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-base file:mr-3 file:rounded-lg file:border-0 file:bg-blue-800 file:px-3 file:py-2 file:text-white"
        />

        {photoDataUrl && (
          <img src={photoDataUrl} alt="Foto do glicosímetro" className="h-28 w-full rounded-xl object-cover" />
        )}

        <label className="text-base font-semibold text-slate-900" htmlFor="note">
          Observação (opcional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="min-h-24 w-full rounded-xl border-2 border-slate-400 p-3 text-base"
          placeholder="Ex.: medição em jejum"
        />

        <button className="h-12 min-h-11 w-full rounded-xl bg-blue-800 text-base font-bold text-white" type="submit">
          Salvar registro
        </button>
      </form>

      <div className="rounded-2xl border-2 border-slate-300 bg-white p-3">
        <p className="mb-2 text-sm font-semibold text-slate-700">Período do gráfico</p>
        <div className="grid grid-cols-3 gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setPeriod(days as Period)}
              className={`rounded-lg border-2 px-2 text-sm font-semibold ${
                period === days ? 'border-blue-800 bg-blue-800 text-white' : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-blue-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-700">Time in Range</p>
          <p className="text-2xl font-bold text-blue-900">{timeInRange}%</p>
        </div>
        <div className="rounded-xl border-2 border-emerald-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-700">Média</p>
          <p className="text-2xl font-bold text-emerald-800">{average} mg/dL</p>
        </div>
      </div>

      <article className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4">
        <h2 className="text-base font-bold text-purple-900">Análise rápida</h2>
        <p className="mt-1 text-base text-slate-900">{aiMessage}</p>
        <p className="mt-1 text-sm text-slate-700">Hemoglobina glicada estimada: {getEstimatedA1c(average)}%</p>
      </article>

      <article className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 text-base text-slate-900">
        Lembrete: registre a glicemia ao acordar e antes de dormir para acompanhar melhor os padrões.
      </article>

      {message && <p className="rounded-xl border-2 border-slate-300 bg-white p-3 text-base text-slate-800">{message}</p>}

      <ul className="space-y-2">
        {visibleEntries.slice(0, 10).map((entry) => (
          <li key={entry.id} className="rounded-xl border-2 border-slate-300 bg-white p-3">
            <p className="text-base font-bold text-slate-900">{entry.value} mg/dL</p>
            <p className="text-sm text-slate-700">{toLocalDate(entry.measuredAt)}</p>
            {entry.note && <p className="text-sm text-slate-700">Obs.: {entry.note}</p>}
            <p className="text-sm text-slate-700">
              Status: {entry.status === 'pending' ? 'Aguardando internet' : 'Sincronizado'}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

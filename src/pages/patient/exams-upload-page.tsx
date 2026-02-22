import { ChangeEvent, useState } from 'react';

type UploadedExam = {
  id: string;
  name: string;
  status: 'Em análise' | 'Processado';
};

export const ExamsUploadPage = () => {
  const [uploads, setUploads] = useState<UploadedExam[]>([
    { id: '1', name: 'Hemoglobina glicada - Nov/2026', status: 'Em análise' },
  ]);

  const onUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newItem: UploadedExam = {
      id: crypto.randomUUID(),
      name: file.name,
      status: 'Em análise',
    };

    setUploads((current) => [newItem, ...current]);
    event.target.value = '';

    window.setTimeout(() => {
      setUploads((current) =>
        current.map((item) => (item.id === newItem.id ? { ...item, status: 'Processado' } : item)),
      );
    }, 1600);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Upload de exames</h1>

      <div className="space-y-3 rounded-2xl border-2 border-slate-300 bg-white p-4">
        <label className="block text-base font-semibold text-slate-900" htmlFor="camera-upload">
          Tirar foto do exame
        </label>
        <input
          id="camera-upload"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onUpload}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-800 file:px-3 file:py-2 file:text-white"
        />

        <label className="block text-base font-semibold text-slate-900" htmlFor="gallery-upload">
          Selecionar da galeria
        </label>
        <input
          id="gallery-upload"
          type="file"
          accept="image/*,.pdf"
          onChange={onUpload}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white"
        />
        <p className="text-base text-slate-800">Tipos aceitos: bioimpedância, exames laboratoriais e PDF.</p>
      </div>

      <ul className="space-y-2">
        {uploads.map((item) => (
          <li key={item.id} className="rounded-2xl border-2 border-slate-300 bg-white p-4">
            <p className="text-base font-bold text-slate-900">{item.name}</p>
            <p className="text-sm text-slate-700">Status: {item.status}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

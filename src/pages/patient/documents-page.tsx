import { useState } from 'react';

type PatientDoc = {
  id: string;
  name: string;
  date: string;
  fileUrl: string;
};

const docs: PatientDoc[] = [
  { id: '1', name: 'Receita de Metformina', date: '10/11/2026', fileUrl: '/docs/receita-metformina.pdf' },
  { id: '2', name: 'Atestado de comparecimento', date: '02/11/2026', fileUrl: '/docs/atestado.pdf' },
  { id: '3', name: 'Relatório médico mensal', date: '28/10/2026', fileUrl: '/docs/relatorio.pdf' },
];

export const DocumentsPage = () => {
  const [feedback, setFeedback] = useState('');

  const onShare = async (doc: PatientDoc) => {
    if (!navigator.share) {
      setFeedback('Seu celular não suporta compartilhamento direto.');
      return;
    }

    try {
      await navigator.share({
        title: doc.name,
        text: `Documento: ${doc.name}`,
        url: window.location.origin + doc.fileUrl,
      });
      setFeedback(`Documento "${doc.name}" compartilhado.`);
    } catch {
      setFeedback('Compartilhamento cancelado.');
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Meus documentos</h1>
      <ul className="space-y-2">
        {docs.map((doc) => (
          <li key={doc.id} className="rounded-xl border-2 border-slate-300 bg-white p-4">
            <p className="text-base font-bold text-slate-900">{doc.name}</p>
            <p className="text-sm text-slate-700">Emitido em {doc.date}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={doc.fileUrl}
                className="flex h-12 items-center justify-center rounded-xl border-2 border-blue-800 px-4 text-base font-semibold text-blue-900"
                download
              >
                Baixar PDF
              </a>
              <button
                type="button"
                onClick={() => onShare(doc)}
                className="h-12 rounded-xl border-2 border-slate-500 px-4 text-base font-semibold text-slate-800"
              >
                Compartilhar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {feedback && <p className="rounded-xl border-2 border-slate-300 bg-white p-3 text-sm text-slate-800">{feedback}</p>}
    </section>
  );
};

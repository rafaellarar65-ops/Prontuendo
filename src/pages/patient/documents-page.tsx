import { ChangeEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientPortalApi, type PatientPortalDocument } from '@/lib/api/patient-portal-api';
import { queryKeys } from '@/lib/query/query-keys';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const DocumentsPage = () => {
  const patient = usePatientAuthStore((state) => state.patient);
  const patientId = patient?.patientId;
  const qc = useQueryClient();

  const [feedback, setFeedback] = useState('');

  const documentsQuery = useQuery({
    queryKey: queryKeys.patientPortalDocuments(patientId ?? 'unknown'),
    queryFn: () => patientPortalApi.listDocuments(patientId!),
    enabled: Boolean(patientId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => patientPortalApi.uploadExam(patientId!, file),
    onSuccess: async () => {
      setFeedback('Documento enviado com sucesso.');
      await qc.invalidateQueries({ queryKey: queryKeys.patientPortalDocuments(patientId ?? 'unknown') });
    },
    onError: () => {
      setFeedback('Falha ao enviar documento. Tente novamente.');
    },
  });

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !patientId) {
      return;
    }

    setFeedback('');
    await uploadMutation.mutateAsync(file);
    event.target.value = '';
  };

  const onShare = async (doc: PatientPortalDocument) => {
    if (!navigator.share) {
      setFeedback('Seu celular não suporta compartilhamento direto.');
      return;
    }

    try {
      await navigator.share({
        title: doc.name,
        text: `Documento: ${doc.name}`,
        url: doc.fileUrl,
      });
      setFeedback(`Documento "${doc.name}" compartilhado.`);
    } catch {
      setFeedback('Compartilhamento cancelado.');
    }
  };

  if (!patientId) {
    return (
      <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">
        Não conseguimos identificar seu paciente. Faça login novamente para acessar seus documentos.
      </section>
    );
  }

  const docs = documentsQuery.data ?? [];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Meus documentos</h1>

      <div className="rounded-xl border-2 border-slate-300 bg-white p-4">
        <label htmlFor="patient-doc-upload" className="block text-sm font-semibold text-slate-900">
          Enviar exame/documento
        </label>
        <input
          id="patient-doc-upload"
          type="file"
          accept="image/*,.pdf"
          onChange={onUpload}
          disabled={uploadMutation.isPending}
          className="mt-2 h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-800 file:px-3 file:py-2 file:text-white disabled:opacity-60"
        />
      </div>

      {documentsQuery.isLoading && <p className="text-sm text-slate-700">Carregando documentos...</p>}
      {documentsQuery.isError && <p className="text-sm text-red-700">Não foi possível carregar os documentos.</p>}

      <ul className="space-y-2">
        {docs.map((doc) => (
          <li key={doc.id} className="rounded-xl border-2 border-slate-300 bg-white p-4">
            <p className="text-base font-bold text-slate-900">{doc.name}</p>
            <p className="text-sm text-slate-700">Emitido em {formatDate(doc.date)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={doc.fileUrl}
                className="flex h-12 items-center justify-center rounded-xl border-2 border-blue-800 px-4 text-base font-semibold text-blue-900"
                download={doc.name}
              >
                Baixar arquivo
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

      {!documentsQuery.isLoading && !docs.length && (
        <p className="text-sm text-slate-600">Nenhum documento compartilhado com você até o momento.</p>
      )}

      {feedback && <p className="rounded-xl border-2 border-slate-300 bg-white p-3 text-sm text-slate-800">{feedback}</p>}
    </section>
  );
};

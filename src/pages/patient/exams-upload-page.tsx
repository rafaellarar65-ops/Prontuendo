import { ChangeEvent, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { http } from '@/lib/api/http';
import { usePatientAuthStore } from '@/lib/stores/patient-auth-store';

interface UploadedExam {
  id: string;
  name: string;
  status: string;
}

export const ExamsUploadPage = () => {
  const patient = usePatientAuthStore((state) => state.patient);
  const patientId = patient?.patientId;

  const [uploads, setUploads] = useState<UploadedExam[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const canUpload = useMemo(() => Boolean(patientId) && !isUploading, [patientId, isUploading]);

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !patientId) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadProgress(0);
    setResultMessage('');

    try {
      const { data } = await http.post(`/patient-portal/${patientId}/upload-exam`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const nextProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(nextProgress);
        },
      });

      const uploadedItem: UploadedExam = {
        id: String(data?.id ?? crypto.randomUUID()),
        name: data?.name ?? file.name,
        status: data?.status ?? 'Processado',
      };

      setUploads((current) => [uploadedItem, ...current]);
      setResultMessage('Exame enviado com sucesso.');
    } catch {
      setResultMessage('Falha ao enviar exame. Confira sua conexão e tente novamente.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  if (!patientId) {
    return (
      <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">
        Não conseguimos identificar seu paciente para upload. Entre novamente para continuar.
      </section>
    );
  }

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
          disabled={!canUpload}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-800 file:px-3 file:py-2 file:text-white disabled:opacity-60"
        />

        <label className="block text-base font-semibold text-slate-900" htmlFor="gallery-upload">
          Selecionar da galeria
        </label>
        <input
          id="gallery-upload"
          type="file"
          accept="image/*,.pdf"
          onChange={onUpload}
          disabled={!canUpload}
          className="h-12 w-full rounded-xl border-2 border-slate-400 px-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-white disabled:opacity-60"
        />
        <p className="text-base text-slate-800">Tipos aceitos: bioimpedância, exames laboratoriais e PDF.</p>

        {isUploading && (
          <div className="rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="mb-2 inline-flex items-center gap-2 font-semibold">
              <Loader2 size={14} className="animate-spin" /> Enviando exame...
            </p>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-700" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="mt-2">{uploadProgress}% concluído</p>
          </div>
        )}

        {resultMessage && <p className="text-sm text-slate-700">{resultMessage}</p>}
      </div>

      <ul className="space-y-2">
        {uploads.map((item) => (
          <li key={item.id} className="rounded-2xl border-2 border-slate-300 bg-white p-4">
            <p className="text-base font-bold text-slate-900">{item.name}</p>
            <p className="text-sm text-slate-700">Status: {item.status}</p>
          </li>
        ))}
        {!uploads.length && <li className="text-sm text-slate-600">Nenhum exame enviado nesta sessão.</li>}
      </ul>
    </section>
  );
};

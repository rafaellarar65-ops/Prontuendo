import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, FileDown, FileText, Loader2, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { consultationApi } from '@/lib/api/consultation-api';
import { http } from '@/lib/api/http';
import { patientApi } from '@/lib/api/patient-api';
import type { Patient } from '@/types/api';
import type { TemplateRecord } from '@/types/template';

const fetchTemplates = async (): Promise<TemplateRecord[]> => {
  const { data } = await http.get<TemplateRecord[]>('/templates');
  return data;
};

const mapTemplateName = (template: TemplateRecord) => template.name ?? template.payload?.name ?? 'Sem nome';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const TemplatesPage = () => {
  const { data: templates, isLoading, refetch } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Array<{ id: string; createdAt: string }>>([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedConsultationId, setSelectedConsultationId] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<TemplateRecord | null>(null);
  const [activeAction, setActiveAction] = useState<'preview' | 'pdf' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTemplate) return;
    patientApi.list().then(setPatients).catch(() => setError('Não foi possível carregar pacientes para o contexto.'));
  }, [activeTemplate]);

  useEffect(() => {
    if (!selectedPatientId) {
      setConsultations([]);
      return;
    }
    consultationApi
      .list(selectedPatientId)
      .then((data) => setConsultations(data.map((item) => ({ id: item.id, createdAt: item.createdAt }))))
      .catch(() => setError('Não foi possível carregar consultas do paciente.'));
  }, [selectedPatientId]);

  const closeModal = () => {
    setActiveTemplate(null);
    setActiveAction(null);
    setSelectedPatientId('');
    setSelectedConsultationId('');
  };

  const runAction = async () => {
    if (!activeTemplate || !activeAction || !selectedPatientId) return;
    setActionLoading(true);
    setError(null);
    try {
      const payload = {
        patientId: selectedPatientId,
        ...(selectedConsultationId ? { consultationId: selectedConsultationId } : {}),
      };
      if (activeAction === 'preview') {
        await http.post(`/templates/${activeTemplate.id}/render`, payload);
      } else {
        const { data } = await http.post<Blob>(`/templates/${activeTemplate.id}/pdf`, payload, { responseType: 'blob' as const });
        const safeName = mapTemplateName(activeTemplate).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        downloadBlob(data, `${safeName || 'template'}-preview.pdf`);
      }
      closeModal();
      void refetch();
    } catch {
      setError(activeAction === 'preview' ? 'Falha ao gerar preview com dados.' : 'Falha ao gerar PDF.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ClinicalPageShell subtitle="Biblioteca de templates de consulta" title="Templates">
      <section className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{templates?.length ?? 0} template(s) salvos</p>
          <Link
            to="/templates/builder"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus size={14} /> Novo template
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        )}

        {!isLoading && (!templates || templates.length === 0) && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12 text-slate-400">
            <FileText size={32} className="mb-2 opacity-30" />
            <p className="text-sm">Nenhum template salvo ainda.</p>
            <Link to="/templates/builder" className="mt-2 text-sm text-indigo-600 hover:underline">
              Criar primeiro template →
            </Link>
          </div>
        )}

        {templates && templates.length > 0 && (
          <ul className="space-y-2">
            {templates.map((t) => (
              <li key={t.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-indigo-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{mapTemplateName(t)}</p>
                    <p className="text-xs text-slate-400">Categoria: {t.category ?? 'Sem categoria'}</p>
                    {t.updatedAt && (
                      <p className="text-xs text-slate-400">
                        Atualizado em {new Date(t.updatedAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTemplate(t);
                        setActiveAction('preview');
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      type="button"
                    >
                      <Eye size={12} /> Preview com dados
                    </button>
                    <button
                      onClick={() => {
                        setActiveTemplate(t);
                        setActiveAction('pdf');
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      type="button"
                    >
                      <FileDown size={12} /> Gerar PDF
                    </button>
                    <Link
                      to="/templates/builder"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {activeTemplate && activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{activeAction === 'preview' ? 'Preview com dados' : 'Gerar PDF'}</h3>
              <button type="button" onClick={closeModal}><X size={15} /></button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-500">Template: <span className="font-medium">{mapTemplateName(activeTemplate)}</span></p>
              <label className="block text-xs font-medium text-slate-600">Paciente</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full rounded border border-slate-200 px-2 py-2 text-sm"
              >
                <option value="">Selecione um paciente...</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.fullName}</option>
                ))}
              </select>

              <label className="block text-xs font-medium text-slate-600">Consulta (opcional)</label>
              <select
                value={selectedConsultationId}
                onChange={(e) => setSelectedConsultationId(e.target.value)}
                className="w-full rounded border border-slate-200 px-2 py-2 text-sm"
                disabled={!selectedPatientId}
              >
                <option value="">Sem consulta específica</option>
                {consultations.map((consultation) => (
                  <option key={consultation.id} value={consultation.id}>
                    {new Date(consultation.createdAt).toLocaleDateString('pt-BR')} - {consultation.id.slice(0, 8)}
                  </option>
                ))}
              </select>

              {error && <p className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-600">{error}</p>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="rounded border px-3 py-1.5 text-xs" onClick={closeModal}>Cancelar</button>
              <button
                type="button"
                className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:bg-indigo-300"
                onClick={runAction}
                disabled={!selectedPatientId || actionLoading}
              >
                {actionLoading ? <Loader2 size={12} className="animate-spin" /> : activeAction === 'preview' ? 'Gerar preview' : 'Gerar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ClinicalPageShell>
  );
};

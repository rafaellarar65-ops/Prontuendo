import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Loader2, Plus } from 'lucide-react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { http } from '@/lib/api/http';

interface TemplateItem {
  id: string;
  payload?: { name?: string };
  createdAt?: string;
  updatedAt?: string;
}

const fetchTemplates = async (): Promise<TemplateItem[]> => {
  const { data } = await http.get<TemplateItem[]>('/templates');
  return data;
};

export const TemplatesPage = () => {
  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

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
              <li key={t.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <FileText size={16} className="text-indigo-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{t.payload?.name ?? 'Sem nome'}</p>
                  {t.updatedAt && (
                    <p className="text-xs text-slate-400">
                      Atualizado em {new Date(t.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <Link
                  to="/templates/builder"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ClinicalPageShell>
  );
};

import { Link } from 'react-router-dom';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';

const templates = [
  { id: 't1', name: 'Consulta inicial DM2', updatedAt: '2026-02-10' },
  { id: 't2', name: 'Retorno obesidade', updatedAt: '2026-02-05' },
];

export const TemplatesPage = () => (
  <ClinicalPageShell subtitle="Biblioteca de templates de consulta" title="Templates">
    <section className="space-y-3 rounded-lg border bg-white p-4">
      <Link className="inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" to="/templates/builder">
        Abrir Template Builder
      </Link>
      <ul className="space-y-2">
        {templates.map((template) => (
          <li className="rounded border p-3" key={template.id}>
            <p className="font-medium">{template.name}</p>
            <p className="text-xs text-muted-foreground">Atualizado em {template.updatedAt}</p>
          </li>
        ))}
      </ul>
    </section>
  </ClinicalPageShell>
);

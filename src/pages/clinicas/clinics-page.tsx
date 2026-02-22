import { ClinicalPageShell } from '@/components/app/clinical-page-shell';

const clinics = [
  { id: 'c1', name: 'Clínica Matriz', city: 'São Paulo' },
  { id: 'c2', name: 'Unidade Norte', city: 'Campinas' },
];

export const ClinicsPage = () => (
  <ClinicalPageShell subtitle="Gestão de unidades e permissões" title="Clínicas">
    <section className="rounded-lg border bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        {clinics.map((clinic) => (
          <article className="rounded border p-3" key={clinic.id}>
            <h2 className="font-medium">{clinic.name}</h2>
            <p className="text-sm text-muted-foreground">{clinic.city}</p>
          </article>
        ))}
      </div>
    </section>
  </ClinicalPageShell>
);

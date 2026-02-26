import { useMemo, useState } from 'react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { useCreateClinicMutation, useUpdateClinicMutation } from '@/features/clinics/use-clinic-mutations';
import { useClinicsQuery } from '@/features/clinics/use-clinics-query';

export const ClinicsPage = () => {
  const { data, isLoading, isError } = useClinicsQuery();
  const { mutate: createClinic, isPending: isCreating } = useCreateClinicMutation();
  const { mutate: updateClinic, isPending: isUpdating } = useUpdateClinicMutation();

  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');

  const filtered = useMemo(
    () => (data ?? []).filter((clinic) => `${clinic.payload.name} ${clinic.payload.city}`.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  return (
    <ClinicalPageShell
      subtitle="Gestão de unidades e permissões"
      title="Clínicas"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && filtered.length === 0}
    >
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Filtrar por nome/cidade" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Nova clínica" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <div className="flex gap-2">
            <input className="flex-1 rounded border px-3 py-2 text-sm" placeholder="Cidade" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
              disabled={isCreating || !newName || !newCity}
              onClick={() => createClinic({ name: newName, city: newCity }, { onSuccess: () => { setNewName(''); setNewCity(''); } })}
            >
              Criar
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((clinic) => (
            <article className="rounded border p-3" key={clinic.id}>
              <input
                className="w-full rounded border px-2 py-1 font-medium"
                defaultValue={clinic.payload.name}
                onBlur={(e) => {
                  if (e.target.value !== clinic.payload.name) {
                    updateClinic({ id: clinic.id, payload: { name: e.target.value } });
                  }
                }}
              />
              <input
                className="mt-2 w-full rounded border px-2 py-1 text-sm text-muted-foreground"
                defaultValue={clinic.payload.city}
                onBlur={(e) => {
                  if (e.target.value !== clinic.payload.city) {
                    updateClinic({ id: clinic.id, payload: { city: e.target.value } });
                  }
                }}
              />
            </article>
          ))}
        </div>
        {isUpdating ? <p className="text-xs text-muted-foreground">Salvando alterações...</p> : null}
      </section>
    </ClinicalPageShell>
  );
};

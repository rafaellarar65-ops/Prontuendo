import { useMemo, useState } from 'react';
import { ClinicalPageShell } from '@/components/app/clinical-page-shell';
import { useCreateProtocolMutation, useUpdateProtocolMutation } from '@/features/protocols/use-protocol-mutations';
import { useProtocolsQuery } from '@/features/protocols/use-protocols-query';

export const ProtocolsPage = () => {
  const { data, isLoading, isError } = useProtocolsQuery();
  const { mutate: createProtocol, isPending: isCreating } = useCreateProtocolMutation();
  const { mutate: updateProtocol } = useUpdateProtocolMutation();

  const [search, setSearch] = useState('');
  const [name, setName] = useState('');

  const filtered = useMemo(
    () => (data ?? []).filter((protocol) => protocol.payload.name.toLowerCase().includes(search.toLowerCase())),
    [data, search],
  );

  return (
    <ClinicalPageShell
      subtitle="Protocolos clínicos da prática"
      title="Protocolos"
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && !isError && filtered.length === 0}
    >
      <section className="space-y-3 rounded-lg border bg-white p-4">
        <div className="grid gap-2 md:grid-cols-3">
          <input className="rounded border px-3 py-2 text-sm" placeholder="Filtrar protocolos" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="rounded border px-3 py-2 text-sm" placeholder="Novo protocolo" value={name} onChange={(e) => setName(e.target.value)} />
          <button
            type="button"
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
            disabled={isCreating || !name}
            onClick={() => createProtocol({ name, status: 'ATIVO' }, { onSuccess: () => setName('') })}
          >
            Criar
          </button>
        </div>

        <section className="grid gap-3 md:grid-cols-2">
          {filtered.map((protocol) => (
            <article className="rounded border p-3" key={protocol.id}>
              <input
                className="w-full rounded border px-2 py-1 font-medium"
                defaultValue={protocol.payload.name}
                onBlur={(e) => e.target.value !== protocol.payload.name && updateProtocol({ id: protocol.id, payload: { name: e.target.value } })}
              />
              <p className="mt-2 text-sm text-muted-foreground">Versão ativa disponível para consultas.</p>
            </article>
          ))}
        </section>
      </section>
    </ClinicalPageShell>
  );
};

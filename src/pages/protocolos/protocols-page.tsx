import { ClinicalPageShell } from '@/components/app/clinical-page-shell';

const protocols = [
  'Protocolo de insulinização basal',
  'Ajuste de metformina',
  'Protocolo obesidade com acompanhamento nutricional',
];

export const ProtocolsPage = () => (
  <ClinicalPageShell subtitle="Protocolos clínicos da prática" title="Protocolos">
    <section className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2">
      {protocols.map((protocol) => (
        <article className="rounded border p-3" key={protocol}>
          <h2 className="font-medium">{protocol}</h2>
          <p className="text-sm text-muted-foreground">Versão ativa disponível para consultas.</p>
        </article>
      ))}
    </section>
  </ClinicalPageShell>
);

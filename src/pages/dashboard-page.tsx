import type { DashboardKpi } from '@/types/domain';

const kpis: DashboardKpi[] = [
  { id: '1', label: 'Consultas hoje', value: '18', trend: 'up' },
  { id: '2', label: 'Pacientes ativos', value: '142', trend: 'stable' },
  { id: '3', label: 'Pendências de exames', value: '27', trend: 'down' },
];

const trendLabel: Record<DashboardKpi['trend'], string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

export const DashboardPage = () => (
  <main className="space-y-4 p-6">
    <h1 className="text-2xl font-semibold">Dashboard</h1>
    <section className="grid gap-4 md:grid-cols-3">
      {kpis.map((kpi) => (
        <article className="rounded-lg border bg-white p-4" key={kpi.id}>
          <p className="text-sm text-muted-foreground">{kpi.label}</p>
          <p className="mt-1 text-2xl font-semibold">{kpi.value}</p>
          <p className="text-sm text-muted-foreground">{trendLabel[kpi.trend]} tendência semanal</p>
        </article>
      ))}
    </section>
  </main>
);

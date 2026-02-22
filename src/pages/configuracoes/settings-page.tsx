import { ClinicalPageShell } from '@/components/app/clinical-page-shell';

export const SettingsPage = () => (
  <ClinicalPageShell subtitle="Preferências do sistema e integrações" title="Configurações">
    <section className="space-y-3 rounded-lg border bg-white p-4">
      <label className="flex items-center justify-between rounded border p-3">
        <span>Notificações por e-mail</span>
        <input defaultChecked type="checkbox" />
      </label>
      <label className="flex items-center justify-between rounded border p-3">
        <span>Lembretes automáticos de consulta</span>
        <input defaultChecked type="checkbox" />
      </label>
      <label className="flex items-center justify-between rounded border p-3">
        <span>Modo compacto de dashboard</span>
        <input type="checkbox" />
      </label>
    </section>
  </ClinicalPageShell>
);

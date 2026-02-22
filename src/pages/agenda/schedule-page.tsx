import { ClinicalPageShell } from '@/components/app/clinical-page-shell';

const appointments = [
  { id: 'a1', hour: '08:00', patient: 'Amanda Souza', type: 'Retorno' },
  { id: 'a2', hour: '09:30', patient: 'Rafael Lima', type: 'Primeira consulta' },
  { id: 'a3', hour: '11:00', patient: 'Lucas Dias', type: 'Teleconsulta' },
];

export const SchedulePage = () => (
  <ClinicalPageShell subtitle="Gestão da agenda médica" title="Agenda">
    <section className="rounded-lg border bg-white p-4">
      <ul className="space-y-2">
        {appointments.map((appointment) => (
          <li className="flex items-center justify-between rounded border p-2" key={appointment.id}>
            <span className="font-medium">{appointment.hour}</span>
            <span>{appointment.patient}</span>
            <span className="text-sm text-muted-foreground">{appointment.type}</span>
          </li>
        ))}
      </ul>
    </section>
  </ClinicalPageShell>
);

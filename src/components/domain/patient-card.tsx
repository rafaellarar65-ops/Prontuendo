import type { Patient } from '@/types/api';
import { StatusBadge } from '@/components/domain/status-badge';

interface PatientCardProps {
  patient: Patient;
}

export const PatientCard = ({ patient }: PatientCardProps) => (
  <article className="rounded-lg border bg-white p-4 shadow-sm">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="font-semibold">{patient.fullName}</h3>
      <StatusBadge label={patient.sex} tone="neutral" />
    </div>
    <p className="text-sm text-muted-foreground">Nascimento: {patient.birthDate}</p>
    <p className="text-sm text-muted-foreground">Contato: {patient.phone ?? 'Não informado'}</p>
  </article>
);

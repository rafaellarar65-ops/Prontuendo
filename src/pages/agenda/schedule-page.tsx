import { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppointmentsQuery } from '@/features/appointments/use-appointments-query';
import { useCreateAppointmentMutation } from '@/features/appointments/use-create-appointment-mutation';
import { usePatientsQuery } from '@/features/patients/use-patients-query';
import type { Appointment, CreateAppointmentDto } from '@/types/api';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (d: Date) => d.toISOString().split('T')[0] ?? '';

const typeLabel: Record<Appointment['type'], string> = {
  PRIMEIRA_CONSULTA: 'Primeira Consulta',
  RETORNO: 'Retorno',
  TELECONSULTA: 'Teleconsulta',
  EXAME: 'Exame',
  URGENCIA: 'Urgência',
};

const typeColor: Record<Appointment['type'], string> = {
  PRIMEIRA_CONSULTA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RETORNO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TELECONSULTA: 'bg-violet-50 text-violet-700 border-violet-200',
  EXAME: 'bg-amber-50 text-amber-700 border-amber-200',
  URGENCIA: 'bg-rose-50 text-rose-700 border-rose-200',
};

const statusDot: Record<Appointment['status'], string> = {
  AGENDADO: 'bg-slate-400',
  CONFIRMADO: 'bg-emerald-500',
  EM_ANDAMENTO: 'bg-indigo-500',
  CONCLUIDO: 'bg-emerald-700',
  CANCELADO: 'bg-rose-500',
  FALTOU: 'bg-amber-500',
};

// ── Appointment card ──────────────────────────────────────────────
const AppointmentCard = ({ appt }: { appt: Appointment }) => (
  <div className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
    <div className="flex h-12 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50">
      <Clock size={12} className="text-indigo-400 mb-0.5" />
      <span className="text-sm font-bold text-indigo-700">{appt.time ?? new Date(appt.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold text-slate-800">
        {appt.patientName ?? appt.patient?.fullName ?? 'Paciente'}
      </p>
      <span
        className={clsx(
          'mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium',
          typeColor[appt.type],
        )}
      >
        {typeLabel[appt.type]}
      </span>
    </div>
    <div className="flex flex-shrink-0 items-center gap-1.5">
      <span className={clsx('h-2 w-2 rounded-full', statusDot[appt.status])} />
      <span className="text-xs text-slate-500">{appt.status}</span>
    </div>
  </div>
);

// ── New Appointment Modal ─────────────────────────────────────────
type NewAppointmentForm = {
  patientId: string;
  date: string;
  time: string;
  type: Appointment['type'];
  notes?: string;
};

const EMPTY: NewAppointmentForm = {
  patientId: '',
  date: fmt(new Date()),
  time: '08:00',
  type: 'RETORNO',
  notes: '',
};

const NewAppointmentModal = ({
  initialDate,
  onClose,
}: {
  initialDate: string;
  onClose: () => void;
}) => {
  const { mutate, isPending, error } = useCreateAppointmentMutation();
  const { data: patients } = usePatientsQuery();
  const [form, setForm] = useState<NewAppointmentForm>({ ...EMPTY, date: initialDate });

  const set =
    (key: keyof NewAppointmentForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dto: CreateAppointmentDto = {
      tenantId: '',
      clinicianId: '',
      patientId: form.patientId,
      scheduledAt: `${form.date}T${form.time}:00`,
      durationMin: 30,
      type: form.type,
      ...(form.notes ? { notes: form.notes } : {}),
    };
    mutate(dto, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800">Novo agendamento</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Paciente <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={form.patientId}
              onChange={set('patientId')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Selecione um paciente</option>
              {patients?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Data <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="date"
                value={form.date}
                onChange={set('date')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Horário <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="time"
                value={form.time}
                onChange={set('time')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tipo <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={set('type')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="PRIMEIRA_CONSULTA">Primeira Consulta</option>
              <option value="RETORNO">Retorno</option>
              <option value="TELECONSULTA">Teleconsulta</option>
              <option value="EXAME">Exame</option>
              <option value="URGENCIA">Urgência</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Observações
            </label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Notas opcionais..."
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              Erro ao criar agendamento. Tente novamente.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? 'Agendando...' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────
export const SchedulePage = () => {
  const [selectedDate, setSelectedDate] = useState(fmt(new Date()));
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useAppointmentsQuery(selectedDate);

  const moveDate = (delta: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(fmt(d));
  };

  const isToday = selectedDate === fmt(new Date());

  const displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gestão dos agendamentos</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          Novo agendamento
        </button>
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={() => moveDate(-1)}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex flex-1 items-center justify-center gap-2">
          <Calendar size={16} className="text-indigo-500" />
          <span className="font-semibold text-slate-700 capitalize">{displayDate}</span>
          {isToday && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
              Hoje
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => moveDate(1)}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
        >
          <ChevronRight size={18} />
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Appointments */}
      {isLoading && (
        <div className="flex justify-center py-16 text-slate-400">
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-slate-400">
          <Calendar size={36} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum agendamento para este dia</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus size={14} /> Agendar paciente
          </button>
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <div className="space-y-2">
          {[...data]
            .sort((a, b) => (a.time ?? a.scheduledAt).localeCompare(b.time ?? b.scheduledAt))
            .map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
        </div>
      )}

      {showModal && (
        <NewAppointmentModal
          initialDate={selectedDate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

import { useMemo, useState } from 'react';
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
import { useCancelAppointmentMutation } from '@/features/appointments/use-cancel-appointment-mutation';
import { useCreateAppointmentMutation } from '@/features/appointments/use-create-appointment-mutation';
import { useUpdateAppointmentMutation } from '@/features/appointments/use-update-appointment-mutation';
import { usePatientsQuery } from '@/features/patients/use-patients-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { Appointment, CreateAppointmentDto } from '@/types/api';

type LocalAppointmentType = 'PRIMEIRA_CONSULTA' | 'RETORNO' | 'TELECONSULTA' | 'EXAME';
type LocalAppointmentStatus = 'AGENDADO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (d: Date) => d.toISOString().split('T')[0] ?? '';
const toLocalDateTime = (date: string, time: string) => `${date}T${time}:00`;
const getAppointmentDate = (appt: Appointment) => appt.scheduledAt ?? toLocalDateTime(appt.date ?? '', appt.time ?? '00:00');
const formatTime = (appt: Appointment) =>
  new Date(getAppointmentDate(appt)).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const normalizeType = (type: Appointment['type']): LocalAppointmentType => {
  switch (type) {
    case 'INITIAL_CONSULTATION':
      return 'PRIMEIRA_CONSULTA';
    case 'FOLLOW_UP':
      return 'RETORNO';
    case 'TELECONSULTATION':
      return 'TELECONSULTA';
    case 'EXAM':
      return 'EXAME';
    default:
      return type;
  }
};

const normalizeStatus = (status: Appointment['status']): LocalAppointmentStatus => {
  switch (status) {
    case 'SCHEDULED':
      return 'AGENDADO';
    case 'CONFIRMED':
      return 'CONFIRMADO';
    case 'IN_PROGRESS':
      return 'EM_ANDAMENTO';
    case 'COMPLETED':
      return 'CONCLUIDO';
    case 'CANCELED':
      return 'CANCELADO';
    default:
      return status;
  }
};

const typeLabel: Record<LocalAppointmentType, string> = {
  PRIMEIRA_CONSULTA: 'Primeira Consulta',
  RETORNO: 'Retorno',
  TELECONSULTA: 'Teleconsulta',
  EXAME: 'Exame',
};

const typeColor: Record<LocalAppointmentType, string> = {
  PRIMEIRA_CONSULTA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RETORNO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TELECONSULTA: 'bg-violet-50 text-violet-700 border-violet-200',
  EXAME: 'bg-amber-50 text-amber-700 border-amber-200',
};

const statusDot: Record<LocalAppointmentStatus, string> = {
  AGENDADO: 'bg-slate-400',
  CONFIRMADO: 'bg-emerald-500',
  EM_ANDAMENTO: 'bg-indigo-500',
  CONCLUIDO: 'bg-emerald-700',
  CANCELADO: 'bg-rose-500',
};

// ── Appointment card ──────────────────────────────────────────────
const AppointmentCard = ({ appt }: { appt: Appointment }) => (
  <div className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md">
    <div className="flex h-12 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50">
      <Clock size={12} className="text-indigo-400 mb-0.5" />
      <span className="text-sm font-bold text-indigo-700">{formatTime(appt)}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold text-slate-800">
        {appt.patientName ?? 'Paciente'}
      </p>
      <span
        className={clsx(
          'mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium',
          typeColor[normalizeType(appt.type)],
        )}
      >
        {typeLabel[normalizeType(appt.type)]}
      </span>
    </div>
    <div className="flex flex-shrink-0 items-center gap-1.5">
      <span className={clsx('h-2 w-2 rounded-full', statusDot[normalizeStatus(appt.status)])} />
      <span className="text-xs text-slate-500">{normalizeStatus(appt.status)}</span>
    </div>
  </div>
);

// ── New Appointment Modal ─────────────────────────────────────────
const EMPTY: CreateAppointmentDto = {
  patientId: '',
  clinicianId: '',
  scheduledAt: new Date().toISOString(),
  durationMin: 30,
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
  const { mutate: updateAppointment } = useUpdateAppointmentMutation();
  const { mutate: cancelAppointment } = useCancelAppointmentMutation();
  const clinicianId = useAuthStore((state) => state.user?.id ?? '');
  const { data: patients } = usePatientsQuery();
  const [form, setForm] = useState<CreateAppointmentDto>({
    ...EMPTY,
    clinicianId,
    scheduledAt: toLocalDateTime(initialDate, '08:00'),
  });
  const [time, setTime] = useState('08:00');

  const date = useMemo(() => form.scheduledAt.slice(0, 10), [form.scheduledAt]);

  const set =
    (key: keyof CreateAppointmentDto) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const setDate = (value: string) => {
    setForm((prev) => ({ ...prev, scheduledAt: toLocalDateTime(value, time) }));
  };

  const setFormTime = (value: string) => {
    setTime(value);
    setForm((prev) => ({ ...prev, scheduledAt: toLocalDateTime(prev.scheduledAt.slice(0, 10), value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        ...form,
        clinicianId,
      },
      { onSuccess: onClose },
    );
  };

  void updateAppointment;
  void cancelAppointment;

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
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                value={time}
                onChange={(e) => setFormTime(e.target.value)}
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  const selectedDateKey = useMemo(() => fmt(selectedDate), [selectedDate]);

  const { data, isLoading } = useAppointmentsQuery({ date: selectedDateKey });

  const moveDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
  };

  const isToday = selectedDateKey === fmt(new Date());

  const displayDate = selectedDate.toLocaleDateString('pt-BR', {
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
          value={selectedDateKey}
          onChange={(e) => setSelectedDate(new Date(`${e.target.value}T12:00:00`))}
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
            .sort((a, b) => getAppointmentDate(a).localeCompare(getAppointmentDate(b)))
            .map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
        </div>
      )}

      {showModal && (
        <NewAppointmentModal
          initialDate={selectedDateKey}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usePatientsQuery } from '@/features/patients/use-patients-query';
import { useConsultationsQuery } from '@/features/consultations/use-consultations-query';
import { useAppointmentsQuery } from '@/features/appointments/use-appointments-query';

const today = new Date().toISOString().split('T')[0] ?? '';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const appointmentTypeLabel: Record<string, string> = {
  PRIMEIRA_CONSULTA: 'Primeira Consulta',
  RETORNO: 'Retorno',
  TELECONSULTA: 'Teleconsulta',
  EXAME: 'Exame',
};

const appointmentStatusColor: Record<string, string> = {
  AGENDADO: 'bg-slate-100 text-slate-600',
  CONFIRMADO: 'bg-emerald-50 text-emerald-700',
  EM_ANDAMENTO: 'bg-indigo-50 text-indigo-700',
  CONCLUIDO: 'bg-emerald-100 text-emerald-800',
  CANCELADO: 'bg-rose-50 text-rose-600',
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  gradient: string;
  iconBg: string;
}

const KpiCard = ({ label, value, sub, icon: Icon, trend, gradient, iconBg }: KpiCardProps) => (
  <div className={clsx('relative overflow-hidden rounded-2xl p-5 shadow-sm', gradient)}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-white/70">{label}</p>
        <p className="mt-1.5 text-3xl font-bold text-white">{value}</p>
        {sub && (
          <p className="mt-1 flex items-center gap-1 text-xs text-white/60">
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
            {sub}
          </p>
        )}
      </div>
      <div className={clsx('rounded-xl p-2.5', iconBg)}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    {/* Decorative ring */}
    <div className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/5" />
  </div>
);

const quickActions = [
  { to: '/consultas/nova', icon: FileText, label: 'Nova Consulta', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { to: '/pacientes', icon: Users, label: 'Pacientes', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { to: '/agenda', icon: Calendar, label: 'Agenda', color: 'bg-violet-600 hover:bg-violet-700' },
  { to: '/bioimpedancia', icon: Activity, label: 'Bioimpedância', color: 'bg-amber-500 hover:bg-amber-600' },
];

export const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const { data: patients, isLoading: loadingPatients } = usePatientsQuery();
  const { data: consultationsData } = useConsultationsQuery();
  const consultations = Array.isArray(consultationsData) ? consultationsData as Array<{status: string}> : [];
  const { data: todayAppointments, isLoading: loadingAppointments } = useAppointmentsQuery(today);

  const activePatients = patients?.length ?? 0;
  const totalConsultations = consultations.length;
  const inProgress = consultations.filter((c) => c.status === 'EM_ANDAMENTO').length;
  const todayCount = todayAppointments?.length ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Médico'} 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link
          to="/consultas/nova"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-300 transition hover:bg-indigo-700"
        >
          <Plus size={16} />
          Nova consulta
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Consultas hoje"
          value={loadingAppointments ? '—' : todayCount}
          sub="Agendamentos do dia"
          icon={Calendar}
          gradient="bg-gradient-to-br from-indigo-600 to-indigo-700"
          iconBg="bg-indigo-500/40"
        />
        <KpiCard
          label="Pacientes ativos"
          value={loadingPatients ? '—' : activePatients}
          sub="Total cadastrado"
          icon={Users}
          trend="up"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          iconBg="bg-emerald-400/30"
        />
        <KpiCard
          label="Em andamento"
          value={inProgress}
          sub="Consultas abertas"
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          iconBg="bg-amber-400/30"
        />
        <KpiCard
          label="Total de consultas"
          value={totalConsultations}
          sub="Histórico geral"
          icon={Activity}
          gradient="bg-gradient-to-br from-violet-600 to-purple-700"
          iconBg="bg-violet-400/30"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className={clsx(
                'flex flex-col items-center gap-2 rounded-xl p-4 text-white shadow-sm transition',
                color,
              )}
            >
              <Icon size={22} />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's appointments */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Agenda de hoje
          </h2>
          <Link
            to="/agenda"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Ver tudo <ArrowRight size={12} />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingAppointments ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400">
              Carregando agenda...
            </div>
          ) : !todayAppointments?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Calendar size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Nenhum agendamento para hoje</p>
              <Link
                to="/agenda"
                className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Agendar paciente
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todayAppointments.map((appt) => (
                <li key={appt.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600 text-sm">
                    {appt.time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {appt.patientName ?? 'Paciente'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {appointmentTypeLabel[appt.type] ?? appt.type}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      appointmentStatusColor[appt.status] ?? 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {appt.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent patients */}
      {!!patients?.length && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Últimos pacientes
            </h2>
            <Link
              to="/pacientes"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {patients.slice(0, 5).map((p) => {
                const age = p.birthDate
                  ? Math.floor(
                      (Date.now() - new Date(p.birthDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 365.25),
                    )
                  : null;
                const initials = p.fullName
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();
                return (
                  <li key={p.id}>
                    <Link
                      to={`/pacientes/${p.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {p.fullName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {age !== null ? `${age} anos` : ''}
                          {age !== null && p.phone ? ' · ' : ''}
                          {p.phone ?? ''}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

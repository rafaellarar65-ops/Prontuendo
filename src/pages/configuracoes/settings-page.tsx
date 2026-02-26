import axios from 'axios';
import { useState } from 'react';
import {
  Bell,
  Check,
  Globe,
  Loader2,
  Lock,
  Moon,
  Palette,
  Sun,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';
import { authApi } from '@/lib/api/auth-api';
import { usersApi } from '@/lib/api/users-api';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUiStore } from '@/lib/stores/ui-store';

// ── Toggle ─────────────────────────────────────────────────────────
const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={clsx(
      'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
      checked ? 'bg-indigo-600' : 'bg-slate-200',
    )}
  >
    <span
      className={clsx(
        'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0',
      )}
    />
  </button>
);

// ── Section card ───────────────────────────────────────────────────
const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
        <Icon size={16} className="text-indigo-600" />
      </div>
      <h2 className="font-semibold text-slate-800">{title}</h2>
    </div>
    <div className="px-6 py-4">{children}</div>
  </div>
);

// ── Row ────────────────────────────────────────────────────────────
const Row = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
    <div className="mr-4">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
    </div>
    {children}
  </div>
);

// ── Theme selector ─────────────────────────────────────────────────
const themes = [
  { value: 'light' as const, label: 'Claro', icon: Sun },
  { value: 'dark' as const, label: 'Escuro', icon: Moon },
  { value: 'system' as const, label: 'Sistema', icon: Globe },
];

const extractApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const message = error.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
};

// ── Page ────────────────────────────────────────────────────────────
export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { theme, setTheme } = useUiStore();

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    specialty: user?.specialty ?? '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [notifications, setNotifications] = useState({
    emailConsulta: true,
    emailAgenda: true,
    smsLembrete: false,
    appPendencias: true,
  });

  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setSavingProfile(true);

    try {
      const updatedProfile = await usersApi.updateProfile({
        fullName: profile.name,
        email: profile.email,
      });

      updateUser({
        ...updatedProfile,
        ...(user?.specialty ? { specialty: user.specialty } : {}),
      });

      setProfile((current) => ({
        ...current,
        name: updatedProfile.name,
        email: updatedProfile.email,
      }));
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2500);
    } catch (error) {
      setProfileError(extractApiErrorMessage(error, 'Não foi possível salvar o perfil.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (password.next !== password.confirm) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    if (password.next.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setSavingPassword(true);

    try {
      await authApi.changePassword({
        currentPassword: password.current,
        newPassword: password.next,
      });
      setPassword({ current: '', next: '', confirm: '' });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (error) {
      setPasswordError(extractApiErrorMessage(error, 'Não foi possível alterar a senha.'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="mt-0.5 text-sm text-slate-500">Preferências do sistema e da conta</p>
      </div>

      {/* Profile */}
      <Section icon={User} title="Perfil">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nome completo
              </label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Especialidade
            </label>
            <input
              value={profile.specialty}
              onChange={(e) => setProfile((p) => ({ ...p, specialty: e.target.value }))}
              placeholder="ex: Endocrinologista"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          {profileError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {profileError}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingProfile ? (
                <Loader2 size={14} className="animate-spin" />
              ) : savedProfile ? (
                <Check size={14} />
              ) : null}
              {savingProfile ? 'Salvando...' : savedProfile ? 'Salvo!' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notificações">
        <div className="divide-y divide-slate-100">
          <Row
            label="E-mail — confirmação de consulta"
            description="Receber e-mail ao confirmar uma consulta"
          >
            <Toggle
              checked={notifications.emailConsulta}
              onChange={(v) => setNotifications((n) => ({ ...n, emailConsulta: v }))}
            />
          </Row>
          <Row
            label="E-mail — lembretes de agenda"
            description="Notificação 24h antes do agendamento"
          >
            <Toggle
              checked={notifications.emailAgenda}
              onChange={(v) => setNotifications((n) => ({ ...n, emailAgenda: v }))}
            />
          </Row>
          <Row
            label="SMS — lembrete ao paciente"
            description="Enviar SMS ao paciente no dia anterior"
          >
            <Toggle
              checked={notifications.smsLembrete}
              onChange={(v) => setNotifications((n) => ({ ...n, smsLembrete: v }))}
            />
          </Row>
          <Row
            label="App — pendências"
            description="Alertar sobre consultas e documentos pendentes"
          >
            <Toggle
              checked={notifications.appPendencias}
              onChange={(v) => setNotifications((n) => ({ ...n, appPendencias: v }))}
            />
          </Row>
        </div>
      </Section>

      {/* Appearance */}
      <Section icon={Palette} title="Aparência">
        <Row label="Tema da interface" description="Escolha entre claro, escuro ou automático">
          <div className="flex gap-2">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                  theme === value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-slate-50',
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      {/* Password */}
      <Section icon={Lock} title="Segurança">
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Senha atual
            </label>
            <input
              type="password"
              value={password.current}
              onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nova senha
              </label>
              <input
                type="password"
                value={password.next}
                onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          {passwordError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Senha alterada com sucesso.
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword || !password.current || !password.next}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingPassword && <Loader2 size={14} className="animate-spin" />}
              {savingPassword ? 'Salvando...' : 'Alterar senha'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
};

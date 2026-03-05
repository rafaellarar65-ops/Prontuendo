import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart2,
  Bell,
  Building2,
  Calendar,
  ChevronLeft,
  ClipboardList,
  FileText,
  FlaskConical,
  Pill,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { CommandPalette } from '@/components/layout/command-palette';
import { useUiStore } from '@/lib/stores/ui-store';
import { useAuthStore } from '@/lib/stores/auth-store';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/pacientes', label: 'Pacientes', icon: Users, end: false },
      { to: '/agenda', label: 'Agenda', icon: Calendar, end: false },
    ],
  },
  {
    label: 'Clínico',
    items: [
      { to: '/consultas/nova', label: 'Nova Consulta', icon: Stethoscope, end: false },
      { to: '/bioimpedancia', label: 'Bioimpedância', icon: Activity, end: false },
      { to: '/exames', label: 'Exames', icon: FlaskConical, end: false },
      { to: '/prescricoes', label: 'Prescrições', icon: Pill, end: false },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { to: '/templates', label: 'Templates', icon: FileText, end: false },
      { to: '/protocolos', label: 'Protocolos', icon: ClipboardList, end: false },
      { to: '/escores', label: 'Escores', icon: BarChart2, end: false },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/clinicas', label: 'Clínicas', icon: Building2, end: false },
      { to: '/configuracoes', label: 'Configurações', icon: Settings, end: false },
    ],
  },
];

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ElementType;
  end: boolean;
  collapsed: boolean;
}

const NavItem = ({ to, label, icon: Icon, end, collapsed }: NavItemProps) => (
  <NavLink
    to={to}
    end={end}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      clsx(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 mb-0.5',
        isActive
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
      )
    }
  >
    <Icon size={16} className="flex-shrink-0" />
    {!collapsed && <span className="truncate">{label}</span>}
  </NavLink>
);

export const MedicalShell = () => {
  const { isSidebarCollapsed, toggleSidebar, setCommandPaletteOpen } = useUiStore();
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    void navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'M';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className={clsx(
          'flex flex-shrink-0 flex-col bg-slate-900 transition-all duration-300 ease-in-out',
          isSidebarCollapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Logo */}
        <div
          className={clsx(
            'flex h-16 flex-shrink-0 items-center border-b border-slate-800',
            isSidebarCollapsed ? 'justify-center' : 'gap-3 px-4',
          )}
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-900/50">
            <Stethoscope size={15} className="text-white" />
          </div>
          {!isSidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight text-white">Prontuendo</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-5' : undefined}>
              {!isSidebarCollapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {group.label}
                </p>
              )}
              {isSidebarCollapsed && gi > 0 && (
                <div className="mx-2 mb-3 border-t border-slate-800" />
              )}
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} collapsed={isSidebarCollapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-slate-800 p-2">
          {!isSidebarCollapsed && user && (
            <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white shadow">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.specialty ?? user.role}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            title={isSidebarCollapsed ? 'Sair' : undefined}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
          >
            <LogOut size={15} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
          >
            {isSidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Search size={13} />
              <span className="hidden sm:inline">Buscar...</span>
              <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
              aria-label="Notificações"
            >
              <Bell size={17} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            {user && (
              <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto">
          <CommandPalette />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

import { NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  Briefcase,
  Building2,
  Calendar,
  ChevronLeft,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  Users,
} from 'lucide-react';
import { CommandPalette } from '@/components/layout/command-palette';
import { useUiStore } from '@/lib/stores/ui-store';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pacientes', label: 'Pacientes', icon: Users, end: false },
  { to: '/agenda', label: 'Agenda', icon: Calendar, end: false },
  { to: '/consultas/nova', label: 'Nova Consulta', icon: Stethoscope, end: false },
  { to: '/bioimpedancia', label: 'Bioimpedância', icon: Activity, end: false },
  { to: '/exames', label: 'Exames', icon: FlaskConical, end: false },
  { to: '/templates', label: 'Templates', icon: FileText, end: false },
  { to: '/protocolos', label: 'Protocolos', icon: ClipboardList, end: false },
  { to: '/escores', label: 'Escores', icon: Briefcase, end: false },
  { to: '/clinicas', label: 'Clínicas', icon: Building2, end: false },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, end: false },
];

export const MedicalShell = () => {
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside
        className={`flex flex-shrink-0 flex-col border-r bg-white transition-all duration-200 ${
          isSidebarCollapsed ? 'w-14' : 'w-56'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-3">
          {!isSidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight text-blue-900">Prontuendo</span>
          )}
          <button
            aria-label={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="rounded p-1 text-slate-500 hover:bg-slate-100"
            onClick={toggleSidebar}
            type="button"
          >
            <ChevronLeft
              className={`transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
              size={16}
            />
          </button>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-0.5 px-2">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                  end={end}
                  to={to}
                  title={isSidebarCollapsed ? label : undefined}
                >
                  <Icon className="flex-shrink-0" size={17} />
                  {!isSidebarCollapsed && <span>{label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t p-2">
          <button
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title={isSidebarCollapsed ? 'Sair' : undefined}
            type="button"
          >
            <LogOut className="flex-shrink-0" size={17} />
            {!isSidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <CommandPalette />
        <Outlet />
      </div>
    </div>
  );
};

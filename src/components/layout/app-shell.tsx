import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUiStore } from '@/lib/stores/ui-store';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/pacientes', label: 'Pacientes' },
  { to: '/consultas/nova', label: 'Nova Consulta' },
  { to: '/bioimpedancia', label: 'Bioimpedância' },
  { to: '/exames', label: 'Exames' },
  { to: '/protocolos', label: 'Protocolos' },
  { to: '/escores', label: 'Escores' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/templates', label: 'Templates' },
  { to: '/clinicas', label: 'Clínicas' },
  { to: '/configuracoes', label: 'Configurações' },
];

export const AppShell = () => {
  const location = useLocation();
  const { isSidebarCollapsed, toggleSidebar, theme, setTheme, setCommandPaletteOpen } = useUiStore();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setCommandPaletteOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`border-r bg-white p-4 transition-all ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
        <button className="mb-4 rounded-md border px-3 py-1 text-sm" onClick={toggleSidebar} type="button">
          {isSidebarCollapsed ? '>' : '<'}
        </button>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              className={`block rounded-md px-3 py-2 text-sm ${
                location.pathname.startsWith(item.to) && item.to !== '/'
                  ? 'bg-primary text-primary-foreground'
                  : location.pathname === '/'
                    ? item.to === '/' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    : 'hover:bg-muted'
              }`}
              to={item.to}
            >
              {isSidebarCollapsed ? item.label.slice(0, 1) : item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <p className="text-sm text-muted-foreground">{location.pathname}</p>
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border px-3 py-1 text-sm"
              onClick={() => setCommandPaletteOpen(true)}
              type="button"
            >
              Ctrl+K
            </button>
            <select
              aria-label="Tema"
              className="rounded-md border px-2 py-1 text-sm"
              onChange={(event) => setTheme(event.target.value as 'light' | 'dark' | 'system')}
              value={theme}
            >
              <option value="system">Sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
};

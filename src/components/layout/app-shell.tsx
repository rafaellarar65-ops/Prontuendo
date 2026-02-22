import { Link, Outlet, useLocation } from 'react-router-dom';
import { Activity, FileText, FlaskConical, Home, UserRound } from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/glicemia', label: 'Glicemia', icon: Activity },
  { to: '/exames', label: 'Exames', icon: FlaskConical },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
];

export const AppShell = () => {
  const location = useLocation();

  if (location.pathname === '/login') {
    return <Outlet />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b-2 border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-blue-900">Portal de pacientes - Dr Rafael Lara</p>
      </header>

      <main className="flex-1 px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-slate-300 bg-white">
        <ul className="mx-auto grid h-20 max-w-3xl grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`flex h-full min-h-11 w-full min-w-11 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                    isActive ? 'text-blue-800' : 'text-slate-700'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={22} strokeWidth={2.5} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

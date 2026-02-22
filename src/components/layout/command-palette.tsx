import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUiStore } from '@/lib/stores/ui-store';

const quickActions = [
  { to: '/pacientes', label: 'Ir para pacientes' },
  { to: '/consultas/nova', label: 'Abrir nova consulta' },
  { to: '/bioimpedancia', label: 'Abrir bioimpedância' },
  { to: '/templates/builder', label: 'Abrir template builder' },
  { to: '/agenda', label: 'Abrir agenda' },
  { to: '/exames', label: 'Abrir exames' },
];

export const CommandPalette = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUiStore();
  const actions = useMemo(() => quickActions, []);

  if (!isCommandPaletteOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-20">
      <div className="w-full max-w-xl rounded-lg border bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Command Palette</h2>
          <button className="text-sm text-muted-foreground" onClick={() => setCommandPaletteOpen(false)} type="button">
            Esc
          </button>
        </div>
        <ul className="space-y-2">
          {actions.map((action) => (
            <li key={action.to}>
              <Link
                className="block rounded-md border px-3 py-2 hover:bg-muted"
                onClick={() => setCommandPaletteOpen(false)}
                to={action.to}
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

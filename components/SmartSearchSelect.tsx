'use client';

import { useMemo, useState } from 'react';

type Option = { id: string; label: string; meta: string };

type Props = {
  value: Option | null;
  onChange: (opt: Option | null) => void;
  options: Option[];
  label: string;
};

export function SmartSearchSelect({ value, onChange, options, label }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.meta.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="field">
      <label>{label}</label>
      <input
        placeholder="Buscar opção..."
        value={value ? `${value.label} — ${value.meta}` : query}
        onChange={(e) => {
          onChange(null);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && !value && (
        <div className="search-list">
          {filtered.map((item) => (
            <div
              className="search-item"
              key={item.id}
              onMouseDown={() => {
                onChange(item);
                setQuery('');
                setOpen(false);
              }}
            >
              <strong>{item.label}</strong>
              <div style={{ fontSize: 12, color: '#5b6875' }}>{item.meta}</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="search-item">Nenhum resultado</div>}
        </div>
      )}
      {value && (
        <button className="btn" type="button" onClick={() => onChange(null)}>
          Limpar seleção
        </button>
      )}
    </div>
  );
}

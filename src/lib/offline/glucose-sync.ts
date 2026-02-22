export type GlucoseEntry = {
  id: string;
  value: number;
  measuredAt: string;
  note?: string;
  photoDataUrl?: string;
  status: 'pending' | 'synced';
};

const STORAGE_KEY = 'portal-pacientes-glucose-entries';

const isValidEntry = (value: unknown): value is GlucoseEntry => {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<GlucoseEntry>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.value === 'number' &&
    typeof entry.measuredAt === 'string' &&
    (entry.status === 'pending' || entry.status === 'synced')
  );
};

export const loadGlucoseEntries = (): GlucoseEntry[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
};

const saveEntries = (entries: GlucoseEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const addGlucoseEntry = (entry: Omit<GlucoseEntry, 'status'>) => {
  const current = loadGlucoseEntries();
  current.unshift({ ...entry, status: navigator.onLine ? 'synced' : 'pending' });
  saveEntries(current);
};

export const markAllAsSynced = () => {
  const synced = loadGlucoseEntries().map((entry) => ({ ...entry, status: 'synced' as const }));
  saveEntries(synced);
};

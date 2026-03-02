// Helper para trabalhar com JSON em SQLite (armazena como string)

export function serializeJson<T>(data: T): string {
  return JSON.stringify(data);
}

export function deserializeJson<T>(data: string | null): T | null {
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export function serializeArray(data: string[]): string {
  return JSON.stringify(data);
}

export function deserializeArray(data: string | null): string[] {
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

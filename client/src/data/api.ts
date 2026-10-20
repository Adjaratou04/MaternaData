// Appels à l'API Node.js. La session est portée par un cookie HttpOnly (envoyé automatiquement).
export class ErreurApi extends Error {
  constructor(message: string, public statut: number, public code?: string) { super(message); }
}

async function appel<T>(methode: string, url: string, corps?: unknown): Promise<T> {
  const rep = await fetch(`/api${url}`, {
    method: methode,
    credentials: 'same-origin',
    headers: corps !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: corps !== undefined ? JSON.stringify(corps) : undefined,
  });
  const json = await rep.json().catch(() => ({}));
  if (!rep.ok) throw new ErreurApi(json.erreur || 'Le serveur ne répond pas. Réessayez.', rep.status, json.code);
  return json as T;
}

export const api = {
  get: <T>(url: string) => appel<T>('GET', url),
  post: <T>(url: string, corps: unknown = {}) => appel<T>('POST', url, corps),
};

/** 'AAAA-MM-JJ' -> Date locale à minuit (évite les décalages de fuseau). */
export function versDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) { const [a, m, j] = v.split('-').map(Number); return new Date(a, m - 1, j); }
  return new Date(v);
}
/** Date -> 'AAAA-MM-JJ' */
export function versIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Talking to the rota's routes from a screen.
 *
 * One answer shape for every form: it worked, or here is a sentence (and,
 * where the server knows, which field it is about).
 */

export type Sent = { ok: true } | { ok: false; error: string; fieldErrors: Record<string, string> };

export const OFFLINE = 'That did not save. Check your connection and try again.';

export async function send(url: string, method: 'POST' | 'DELETE', body?: unknown): Promise<Sent> {
  const response = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }).catch(() => null);
  if (!response) return { ok: false, error: OFFLINE, fieldErrors: {} };
  if (response.ok) return { ok: true };
  const answer = (await response.json().catch(() => ({}))) as {
    error?: string;
    fieldErrors?: Record<string, string>;
  };
  return {
    ok: false,
    error: answer.error ?? OFFLINE,
    fieldErrors: answer.fieldErrors ?? {},
  };
}

const WORDS = ['Latte', 'Crumb', 'Scone', 'Mocha', 'Bagel', 'Toast', 'Cocoa', 'Honey', 'Bun'];

/** A starting password that passes the sign-in rules: two words, a symbol and digits. */
export function suggestPassword(): string {
  const pick = new Uint32Array(4);
  crypto.getRandomValues(pick);
  const first = WORDS[pick[0]! % WORDS.length]!;
  const second = WORDS[pick[1]! % WORDS.length]!.toLowerCase();
  // The sign-in rules refuse four of the same character in a row (1111), so the
  // last digit is always different from the one before it.
  const head = 100 + (pick[2]! % 900);
  const last = ((head % 10) + 1 + (pick[3]! % 9)) % 10;
  return `${first}-${second}-${head}${last}`;
}

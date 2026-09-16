// All browser API calls share a short-lived cooldown per backend origin, including across tabs.
const storageKey = "duckmail-api-cooldowns";
const maxEntries = 32;
type Cooldown = { until: number; message: string };
let memory: Record<string, Cooldown> = {};

export class RateLimitError extends Error {
  readonly status = 429;
  constructor(readonly retryAt: number, detail: string) {
    super(`HTTP 429: ${detail} Please retry in ${Math.max(1, Math.ceil((retryAt - Date.now()) / 1000))} seconds.`);
    this.name = "RateLimitError";
  }
}

function readCooldowns(): Record<string, Cooldown> {
  let stored: unknown = memory;
  try { stored = JSON.parse(localStorage.getItem(storageKey) || "null") || memory; } catch {}
  const entries = Object.entries(stored && typeof stored === "object" ? stored : {});
  memory = Object.fromEntries(entries.filter(([key, value]) =>
    key.length <= 512 && value && typeof value.until === "number" &&
    Number.isFinite(value.until) && value.until > Date.now() &&
    typeof value.message === "string" && value.message.length <= 500,
  ).sort((a, b) => b[1].until - a[1].until).slice(0, maxEntries));
  if (Object.keys(memory).length === 0) {
    try { localStorage.removeItem(storageKey); } catch {}
  }
  return memory;
}

function scope(headers: Headers): string {
  const own = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.duckmail.sbs";
  const provider = headers.get("X-DuckMail-Hosted") === "true"
    ? own : headers.get("X-API-Provider-Base-URL") || own;
  try { return new URL(provider).origin; } catch { return own; }
}

export async function rateLimitedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  init.signal?.throwIfAborted();
  // SSR must not share one user's cooldown with other users of the same Node process.
  if (typeof window === "undefined") return globalThis.fetch(url, init);
  const key = scope(new Headers(init.headers));
  const pending = readCooldowns()[key];
  if (pending) throw new RateLimitError(pending.until, pending.message);
  const response = await globalThis.fetch(url, init);
  if (response.status !== 429) return response;
  const retry = response.headers.get("Retry-After");
  const seconds = retry && /^\d+(\.\d+)?$/.test(retry.trim()) ? Number(retry) : NaN;
  const dated = retry ? Date.parse(retry) : NaN;
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Number.isFinite(dated) ? dated - Date.now() : 5000;
  // Keep a finite, bounded timestamp even for a malformed upstream header.
  const until = Date.now() + Math.max(1000, Math.min(delay, 86400000));
  const body = await response.clone().json().catch(() => ({}));
  const detail = body.message || body.detail;
  const message = typeof detail === "string" ? detail.slice(0, 500) : "Too many requests.";
  const previous = readCooldowns()[key];
  memory[key] = previous && previous.until > until ? previous : { until, message };
  memory = Object.fromEntries(Object.entries(memory).sort((a,b) => b[1].until-a[1].until).slice(0,maxEntries));
  try { localStorage.setItem(storageKey, JSON.stringify(memory)); } catch {}
  throw new RateLimitError(memory[key]?.until || until, message);
}

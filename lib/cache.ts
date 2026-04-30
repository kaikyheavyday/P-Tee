/**
 * In-memory rate limiter and response cache. Sufficient for a single Vercel
 * region; replace with Upstash Redis for multi-region production.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(opts: {
  key: string;
  max: number;
  windowMs: number;
}): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const b = buckets.get(opts.key);
  if (!b || b.resetAt < now) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (b.count >= opts.max) {
    return { ok: false, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

const cache = new Map<string, { value: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function cacheGet<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (e.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return e.value as T;
}

export function cacheSet(key: string, value: unknown): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

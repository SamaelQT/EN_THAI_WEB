/**
 * Per-user, in-process rate limiting for the endpoints that cost money (Groq calls).
 *
 * Deliberately dependency-free: a sliding window in a Map. That means the budget is
 * per Node process, so with multiple instances the effective limit is N × the number
 * given here. Good enough to stop one user hammering the AI in a loop; swap for Redis
 * if the app is ever scaled horizontally with a hard spend cap.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** Drop buckets nobody has touched inside the longest window we use (1h). */
function sweep(now: number) {
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  const cutoff = now - 60 * 60_000;
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0 || bucket.hits[bucket.hits.length - 1] < cutoff) {
      buckets.delete(key);
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Seconds until the next slot frees up (0 when ok) */
  retryAfter: number;
};

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key) ?? { hits: [] };
  const cutoff = now - windowMs;
  const hits = bucket.hits.filter((t) => t > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, { hits });
    const retryAfter = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryAfter };
  }

  hits.push(now);
  buckets.set(key, { hits });
  return { ok: true, remaining: limit - hits.length, retryAfter: 0 };
}

/** Presets for the AI endpoints — tuned so normal study never trips them. */
export const AI_LIMITS = {
  /** Generating a lesson is the most expensive call */
  lessonGenerate: { limit: 20, windowMs: 10 * 60_000 },
  /** Chat turns during a conversation lesson */
  conversation:   { limit: 60, windowMs: 10 * 60_000 },
  /** Essay marking */
  writingFeedback:{ limit: 15, windowMs: 10 * 60_000 },
  /** Checkpoint + review set generation */
  quizGenerate:   { limit: 15, windowMs: 10 * 60_000 },
} as const;

/** Convenience wrapper: returns null when allowed, or a 429 Response when not. */
export function enforceRateLimit(
  userId: string,
  name: keyof typeof AI_LIMITS,
): Response | null {
  const { limit, windowMs } = AI_LIMITS[name];
  const result = rateLimit(`${name}:${userId}`, limit, windowMs);
  if (result.ok) return null;

  return Response.json(
    { error: `Bạn đang thao tác quá nhanh. Thử lại sau ${result.retryAfter} giây.` },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
  );
}

// In-memory limiter for login attempts. Suits a single server process;
// move to Redis or the database if the app ever runs on several instances.
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function current(key: string) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) return null;
  return entry;
}

export function isBlocked(key: string, limit: number) {
  return (current(key)?.count ?? 0) >= limit;
}

export function recordFailure(key: string) {
  const entry = current(key);
  if (entry) entry.count += 1;
  else attempts.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });

  if (attempts.size > 10_000) {
    for (const [k, v] of attempts) if (v.resetAt < Date.now()) attempts.delete(k);
  }
}

export function clearFailures(key: string) {
  attempts.delete(key);
}

const rateLimits = new Map<string, { count: number, resetAt: number }>();

// Lightweight in-memory rate limiting per user (development mechanism)
export function checkRateLimit(userId: string, action: 'run' | 'submit' = 'run'): boolean {
  const MAX_REQUESTS_PER_MINUTE = action === 'run' ? 15 : 5;
  const now = Date.now();
  const key = `${userId}_${action}`;
  
  const userRecord = rateLimits.get(key);

  if (!userRecord || now > userRecord.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (userRecord.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  userRecord.count += 1;
  return true;
}


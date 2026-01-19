type RateLimitOptions = {
  windowMs: number;
  max: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

const STORE_KEY = "__magicInvoiceRateLimitStore" as const;

const getStore = () => {
  const globalAny = globalThis as typeof globalThis & {
    [STORE_KEY]?: Map<string, RateLimitState>;
  };
  if (!globalAny[STORE_KEY]) {
    globalAny[STORE_KEY] = new Map();
  }
  return globalAny[STORE_KEY];
};

export const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
};

export const checkRateLimit = (
  key: string,
  options: RateLimitOptions,
): RateLimitResult => {
  const now = Date.now();
  const store = getStore();
  const existing = store.get(key);
  const resetAt = existing?.resetAt ?? now + options.windowMs;

  if (!existing || now > resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.max - 1,
      resetAt: now + options.windowMs,
      retryAfter: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }

  const nextCount = existing.count + 1;
  store.set(key, { count: nextCount, resetAt });

  return {
    allowed: true,
    remaining: Math.max(0, options.max - nextCount),
    resetAt,
    retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
};

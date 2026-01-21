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
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return "unknown";
};

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const getUpstashResult = <T>(response: any, index: number) => {
  const item = Array.isArray(response) ? response[index] : null;
  if (!item || typeof item !== "object") return null;
  return (item as { result?: T }).result ?? null;
};

const checkRateLimitUpstash = async (
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult | null> => {
  if (!upstashUrl || !upstashToken) return null;
  const now = Date.now();
  const ttlSeconds = Math.ceil(options.windowMs / 1000);
  const response = await fetch(`${upstashUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PTTL", key],
    ]),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as unknown;
  const count = Number(getUpstashResult<number>(data, 0) ?? 0);
  const pttl = Number(getUpstashResult<number>(data, 1) ?? -1);

  if (!Number.isFinite(count)) return null;

  let resetAt = now + options.windowMs;
  if (pttl > 0) {
    resetAt = now + pttl;
  } else {
    await fetch(`${upstashUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([["EXPIRE", key, ttlSeconds]]),
    });
  }

  if (count > options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.max - count),
    resetAt,
    retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
};

export const checkRateLimit = async (
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> => {
  const upstashResult = await checkRateLimitUpstash(key, options);
  if (upstashResult) return upstashResult;
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

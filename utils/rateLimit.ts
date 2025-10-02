// Tier-based rate limiting system
// Simple in-memory rate limiting (for production, use Redis or similar)
const requests = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export const TIER_RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    requestsPerMinute: 3,
    requestsPerHour: 10,
    requestsPerDay: 20
  },
  plus: {
    requestsPerMinute: 5,
    requestsPerHour: 25,
    requestsPerDay: 100
  },
  premium: {
    requestsPerMinute: 10,
    requestsPerHour: 60,
    requestsPerDay: 300
  }
};

export function rateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = requests.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or create new window
    requests.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= limit) {
    return false; // Rate limited
  }
  
  current.count++;
  return true;
}

export function tierBasedRateLimit(identifier: string, tier: 'free' | 'plus' | 'premium', window: 'minute' | 'hour' | 'day' = 'hour'): boolean {
  const config = TIER_RATE_LIMITS[tier];
  if (!config) {
    // Fallback to free tier limits
    return rateLimit(identifier, 10, 60000);
  }

  let limit: number;
  let windowMs: number;

  switch (window) {
    case 'minute':
      limit = config.requestsPerMinute;
      windowMs = 60000; // 1 minute
      break;
    case 'hour':
      limit = config.requestsPerHour;
      windowMs = 3600000; // 1 hour
      break;
    case 'day':
      limit = config.requestsPerDay;
      windowMs = 86400000; // 24 hours
      break;
    default:
      limit = config.requestsPerHour;
      windowMs = 3600000;
  }

  return rateLimit(`${identifier}_${tier}_${window}`, limit, windowMs);
}

export function getRateLimitInfo(identifier: string): { remaining: number; resetTime: number } | null {
  const current = requests.get(identifier);
  if (!current) return null;
  
  return {
    remaining: Math.max(0, 10 - current.count),
    resetTime: current.resetTime
  };
}

export function getTierRateLimitInfo(identifier: string, tier: 'free' | 'plus' | 'premium', window: 'minute' | 'hour' | 'day' = 'hour'): { remaining: number; resetTime: number; limit: number } | null {
  const config = TIER_RATE_LIMITS[tier];
  if (!config) return null;

  let limit: number;
  let windowMs: number;

  switch (window) {
    case 'minute':
      limit = config.requestsPerMinute;
      windowMs = 60000;
      break;
    case 'hour':
      limit = config.requestsPerHour;
      windowMs = 3600000;
      break;
    case 'day':
      limit = config.requestsPerDay;
      windowMs = 86400000;
      break;
    default:
      limit = config.requestsPerHour;
      windowMs = 3600000;
  }

  const key = `${identifier}_${tier}_${window}`;
  const current = requests.get(key);
  
  if (!current) {
    return {
      remaining: limit,
      resetTime: Date.now() + windowMs,
      limit: limit
    };
  }
  
  return {
    remaining: Math.max(0, limit - current.count),
    resetTime: current.resetTime,
    limit: limit
  };
}

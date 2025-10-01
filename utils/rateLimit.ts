// Simple in-memory rate limiting (for production, use Redis or similar)
const requests = new Map<string, { count: number; resetTime: number }>();

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

export function getRateLimitInfo(identifier: string): { remaining: number; resetTime: number } | null {
  const current = requests.get(identifier);
  if (!current) return null;
  
  return {
    remaining: Math.max(0, 10 - current.count),
    resetTime: current.resetTime
  };
}

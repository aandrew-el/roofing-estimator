// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated rate limiting service

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data per IP
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  // Maximum number of requests allowed in the window
  maxRequests: number;
  // Time window in milliseconds
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No existing entry - create new one
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Tiered rate limit configs
// Anonymous users get stricter limits, authenticated users get more generous limits

export const RATE_LIMITS = {
  // Chat API - anonymous: 10/min, authenticated: 30/min
  chat: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  chatAuthenticated: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  // Email API - anonymous: 3/min, authenticated: 10/min
  email: {
    maxRequests: 3,
    windowMs: 60 * 1000, // 1 minute
  },
  emailAuthenticated: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Photo upload - anonymous: 5/min, authenticated: 20/min
  photoUpload: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  photoUploadAuthenticated: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  // Photo analysis - anonymous: 3/min, authenticated: 15/min (expensive API)
  photoAnalyze: {
    maxRequests: 3,
    windowMs: 60 * 1000, // 1 minute
  },
  photoAnalyzeAuthenticated: {
    maxRequests: 15,
    windowMs: 60 * 1000, // 1 minute
  },
  // PDF generation - anonymous: 5/min, authenticated: 20/min
  pdf: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  pdfAuthenticated: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Get appropriate rate limit config based on authentication status
 */
export function getRateLimitConfig(
  type: 'chat' | 'email' | 'photoUpload' | 'photoAnalyze' | 'pdf',
  isAuthenticated: boolean
): RateLimitConfig {
  const authKey = `${type}Authenticated` as keyof typeof RATE_LIMITS;
  return isAuthenticated ? RATE_LIMITS[authKey] : RATE_LIMITS[type];
}

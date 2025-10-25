import { Request, Response, NextFunction } from 'express';

const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.path.includes('/ingest')) {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let limit = rateLimits.get(ip);

  if (!limit || now > limit.resetTime) {
    limit = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimits.set(ip, limit);
  }

  limit.count++;

  if (limit.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((limit.resetTime - now) / 1000)
    });
  }

  next();
}

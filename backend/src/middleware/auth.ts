import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string | null;
      username?: string | null;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'watermate-secret-auth-key-2026';

export function createAuthToken(userId: string, username: string): string {
  const payload = {
    userId,
    username,
    exp: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyAuthToken(token: string): { userId: string; username: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(body).digest('base64url');
    if (sig !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (data.exp && Date.now() > data.exp) return null;
    return { userId: data.userId, username: data.username };
  } catch {
    return null;
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifyAuthToken(token);
    if (verified) {
      req.userId = verified.userId;
      req.username = verified.username;
    }
  }
  next();
}

export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yêu cầu đăng nhập để thực hiện' });
  }

  const token = authHeader.substring(7).trim();
  const verified = verifyAuthToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
  }

  req.userId = verified.userId;
  req.username = verified.username;
  next();
}


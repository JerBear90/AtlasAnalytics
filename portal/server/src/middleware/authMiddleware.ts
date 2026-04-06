import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthError } from '../services/authService';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const user = await AuthService.verifyToken(token);
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
    } else {
      res.status(401).json({ error: 'Invalid or expired token.' });
    }
  }
}

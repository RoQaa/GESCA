import { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions/AppError';
import { tokenService } from '../services/token.service';

/**
 * Middleware to authenticate requests using JWT access tokens.
 * Extracts the token from the Authorization header (Bearer token)
 * and attaches the decoded payload to req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Please provide a valid token.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = tokenService.verifyAccessToken(token);
    // Attach decoded user info to request (requires extending Express Request type)
    (req as any).user = payload;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

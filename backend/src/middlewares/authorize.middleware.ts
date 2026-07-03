import { Request, Response, NextFunction } from 'express';
import { AppError } from '../exceptions/AppError';
import { prisma } from '../config/database.config';

/**
 * Middleware to restrict route access based on User Roles.
 * MUST be used after authenticate middleware (which sets req.user).
 * @param allowedRoles Array of role names (e.g., ['Admin', 'Manager'])
 */
export const authorize = (allowedRoles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user || !user.sub) {
        return next(new AppError('You are not logged in. Please log in to get access.', 401));
      }

      // Fetch user's roles from database
      const userRoles = await prisma.userRole.findMany({
        where: { userId: user.sub },
        include: { role: true },
      });

      const hasRole = userRoles.some((ur) => allowedRoles.includes(ur.role.name));

      if (!hasRole) {
        return next(new AppError('You do not have permission to perform this action', 403));
      }

      next();
    } catch (error) {
      return next(new AppError('Authorization failed', 500));
    }
  };
};

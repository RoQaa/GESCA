/**
 * @module express.d.ts
 * @description Express Request augmentation.
 *
 * Extends the Express Request interface to include custom properties
 * attached by our middlewares. TypeScript picks this up automatically
 * because it's in the types/ directory included by tsconfig.
 */

import { JwtPayload } from '../types/auth.types';

declare global {
  namespace Express {
    interface Request {
      /** Attached by authenticate.middleware after JWT verification */
      user?: JwtPayload;

      /** Attached by requestId.middleware — UUID v7 per request */
      requestId?: string;

      /** Sanitized query object (req.query is read-only in Express 5) */
      sanitizedQuery?: Record<string, unknown>;

      /** Request start time for performance logging */
      startTime?: number;
    }
  }
}

export {};

/**
 * @module requestId.middleware
 * @description Attaches a UUID v4 to every incoming request.
 *
 * The request ID is:
 * 1. Attached to req.requestId
 * 2. Sent back in response header X-Request-ID
 * 3. Included in every log entry for request correlation
 *
 * If the client sends an X-Request-ID header, it is reused (for tracing across services).
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Reuse client-provided request ID or generate a new one
  const requestId =
    typeof req.headers['x-request-id'] === 'string'
      ? req.headers['x-request-id']
      : uuidv4();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
}

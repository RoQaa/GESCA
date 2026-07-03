/**
 * @module catchAsync helper
 * @description Async error wrapper for Express route handlers.
 * TypeScript port of the original utils/catchAsync.js.
 *
 * ARCHITECTURE NOTE:
 * Without this wrapper, every async route handler needs:
 *   try { await handler() } catch(e) { next(e) }
 *
 * With catchAsync, the boilerplate disappears:
 *   router.get('/path', catchAsync(async (req, res, next) => { ... }))
 *
 * Any thrown error (including rejected promises) is forwarded to next(),
 * which passes it to the global error handler middleware.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

/**
 * Wraps an async Express route handler to automatically catch promise rejections
 * and forward them to Express's next() error handler.
 */
export function catchAsync(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

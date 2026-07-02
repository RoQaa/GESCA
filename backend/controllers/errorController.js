
const { Prisma } = require('@prisma/client');
const AppError = require(`${__dirname}/../utils/appError`);

// ─── Prisma / PostgreSQL Error Handlers ───────────────────────────────────────

/**
 * P2002 – Unique constraint violation (duplicate field)
 * مثال: email موجود قبل كده
 */
const handleUniqueConstraintError = err => {
  const fields = err.meta?.target ?? [];
  const fieldNames = Array.isArray(fields) ? fields.join(', ') : fields;
  const message = `This ${fieldNames} is already in use. Please use another value.`;
  return new AppError(message, 400);
};

/**
 * P2025 – Record not found
 * مثال: findUniqueOrThrow / updateOrThrow ملقاش الـ record
 */
const handleRecordNotFoundError = err => {
  const cause = err.meta?.cause ?? 'Record not found.';
  return new AppError(cause, 404);
};

/**
 * P2003 – Foreign key constraint violation
 * مثال: بتربط بـ ID مش موجود في الجدول التاني
 */
const handleForeignKeyConstraintError = err => {
  const field = err.meta?.field_name ?? 'related record';
  const message = `Related ${field} does not exist. Please provide a valid reference.`;
  return new AppError(message, 400);
};

/**
 * P2000 – Value too long for column type
 */
const handleValueTooLongError = err => {
  const column = err.meta?.column_name ?? 'field';
  const message = `The value provided for '${column}' is too long.`;
  return new AppError(message, 400);
};

/**
 * P2006 – Invalid value provided for a field
 */
const handleInvalidValueError = err => {
  const model = err.meta?.model_name ?? 'record';
  const field = err.meta?.field_name ?? 'field';
  const message = `Invalid value provided for '${field}' in '${model}'.`;
  return new AppError(message, 400);
};

/**
 * P2011 – Null constraint violation (required field is null)
 */
const handleNullConstraintError = err => {
  const column = err.meta?.constraint ?? 'a required field';
  const message = `The field '${column}' cannot be null. Please provide a value.`;
  return new AppError(message, 400);
};

/**
 * Prisma Validation Error (e.g. wrong data type passed to query)
 */
const handlePrismaValidationError = err => {
  // err.message من Prisma بيجي مفصّل — نبعت جزء منه فقط
  const message = `Invalid input data. Please check your request and try again.`;
  return new AppError(message, 400);
};

// ─── JWT Error Handlers ────────────────────────────────────────────────────────

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// ─── Response Senders ─────────────────────────────────────────────────────────

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }

  // B) RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error → send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // Programming or unknown error → don't leak details
    console.error('ERROR 💥', err);
    return res.status(500).json({
      status: false,
      message: 'Something went very wrong!'
    });
  }

  // B) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
  console.error('ERROR 💥', err);
  return res.status(500).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  });
};

// ─── Global Error Handler ─────────────────────────────────────────────────────

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || false;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;

    // ── Prisma Known Request Errors (P2xxx) ──
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') error = handleUniqueConstraintError(error);
      else if (error.code === 'P2025') error = handleRecordNotFoundError(error);
      else if (error.code === 'P2003') error = handleForeignKeyConstraintError(error);
      else if (error.code === 'P2000') error = handleValueTooLongError(error);
      else if (error.code === 'P2006') error = handleInvalidValueError(error);
      else if (error.code === 'P2011') error = handleNullConstraintError(error);
    }

    // ── Prisma Validation Errors (wrong types / missing required fields) ──
    if (error instanceof Prisma.PrismaClientValidationError) {
      error = handlePrismaValidationError(error);
    }

    // ── JWT Errors ──
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
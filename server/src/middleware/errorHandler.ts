import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If headers already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Custom Application Errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || {}
      }
    });
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input validation failed',
        details: err.flatten().fieldErrors
      }
    });
  }

  // Handle Prisma Database Errors
  if (err.code && err.code.startsWith('P')) {
    // Prisma database error code (e.g. P2002 Unique Constraint)
    console.error('Prisma Error:', err.message);
    return res.status(400).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database constraint violation occurred.',
        details: { code: err.code }
      }
    });
  }

  // Unhandled internal errors
  console.error('Unhandled Error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.'
    }
  });
};

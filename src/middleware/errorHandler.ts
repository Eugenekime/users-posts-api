import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

type ErrorDetail = {
  field: string;
  message: string;
};

function errorResponse(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: ErrorDetail[]
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      status,
      ...(details && { details }),
    },
  });
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        status: err.statusCode,
      },
    });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return errorResponse(
      res,
      400,
      'VALIDATION_ERROR',
      'Validation failed',
      details
    );
  }

  if (err instanceof mongoose.Error.CastError) {
    return errorResponse(
      res,
      400,
      'INVALID_VALUE',
      `Invalid value for "${err.path}"`
    );
  }

  console.error(err);

  return errorResponse(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    'Internal server error'
  );
}

import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Already formatted ApiError
  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    const errors = [];

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      statusCode = 422;
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
      Object.values(err.errors).forEach((e) => {
        errors.push({ field: e.path, message: e.message });
      });
    }
    // Mongoose duplicate key
    else if (err.code === 11000) {
      statusCode = 409;
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      message = `${field} already exists`;
      code = 'CONFLICT';
    }
    // Mongoose cast error (bad ObjectId)
    else if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;
      code = 'BAD_REQUEST';
    }
    // JWT errors
    else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
      code = 'UNAUTHORIZED';
    } else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
      code = 'UNAUTHORIZED';
    }
    // Multer errors
    else if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 400;
      message = 'File too large';
      code = 'FILE_TOO_LARGE';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      statusCode = 400;
      message = 'Too many files';
      code = 'TOO_MANY_FILES';
    }

    error = new ApiError(statusCode, message, errors, code);
  }

  const isDev = process.env.NODE_ENV === 'development';

  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    code: error.code,
    errors: error.errors?.length ? error.errors : undefined,
    ...(isDev && { stack: err.stack }),
  });
};

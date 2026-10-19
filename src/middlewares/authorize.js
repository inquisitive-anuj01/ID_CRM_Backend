import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization guard
 * Usage: authorize('admin') or authorize('admin', 'manager')
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' is not authorized`));
    }
    next();
  };

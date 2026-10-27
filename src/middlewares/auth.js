import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.sub).populate('workspace').lean();
    if (!user) throw ApiError.unauthorized('User not found');
    if (!user.isActive) throw ApiError.unauthorized('Account is deactivated');
    if (!user.workspace || !user.workspace.isActive) {
      throw ApiError.unauthorized('Workspace not found or deactivated');
    }

    // Reject token if password changed after issuance
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) throw ApiError.unauthorized('Password changed. Please log in again');
    }

    req.user = user;
    req.workspace = user.workspace;
    next();
  } catch (err) {
    next(err);
  }
};

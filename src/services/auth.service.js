import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const login = async ({ email, password }) => {
  // Find ALL users with this email across all workspaces.
  // The same email can exist in multiple workspaces (different companies).
  // We match by password to determine which workspace this login belongs to.
  const users = await User.find({ email: email.toLowerCase().trim() })
    .select('+password +refreshTokenHash')
    .populate('workspace');

  if (!users || users.length === 0) throw ApiError.unauthorized('Invalid email or password');

  // Iterate and find the user whose password matches
  let matchedUser = null;
  for (const u of users) {
    if (!u.isActive) continue;                              // skip deactivated accounts
    if (!u.workspace || !u.workspace.isActive) continue;   // skip deactivated workspaces
    const isMatch = await u.comparePassword(password);
    if (isMatch) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) throw ApiError.unauthorized('Invalid email or password');

  const payload = {
    sub: matchedUser._id.toString(),
    role: matchedUser.role,
    workspace: matchedUser.workspace._id.toString(),
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  matchedUser.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  matchedUser.lastLoginAt = new Date();
  await matchedUser.save({ validateBeforeSave: false });

  return { user: matchedUser.toSafeObject(), workspace: matchedUser.workspace, accessToken, refreshToken };
};

export const refreshTokens = async (oldRefreshToken) => {
  if (!oldRefreshToken) throw ApiError.unauthorized('No refresh token');

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash').populate('workspace');
  if (!user || !user.isActive) throw ApiError.unauthorized('User not found or inactive');
  if (!user.workspace || !user.workspace.isActive) throw ApiError.unauthorized('Workspace not found or deactivated');
  if (!user.refreshTokenHash) throw ApiError.unauthorized('Not logged in');

  const valid = await bcrypt.compare(oldRefreshToken, user.refreshTokenHash);
  if (!valid) throw ApiError.unauthorized('Invalid refresh token');

  const payload = { sub: user._id.toString(), role: user.role, workspace: user.workspace._id.toString() };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken, user: user.toSafeObject(), workspace: user.workspace };
};

export const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword;
  await user.save();
};

export { REFRESH_COOKIE_OPTS };

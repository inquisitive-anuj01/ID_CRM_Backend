import * as authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const { REFRESH_COOKIE_OPTS } = authService;

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  ApiResponse.ok(res, 'Login successful', { user, accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  const { accessToken, refreshToken, user } = await authService.refreshTokens(token);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  ApiResponse.ok(res, 'Token refreshed', { accessToken, user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie('refreshToken');
  ApiResponse.ok(res, 'Logged out successfully');
});

export const me = asyncHandler(async (req, res) => {
  ApiResponse.ok(res, 'Current user', req.user);
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);
  ApiResponse.ok(res, 'Password changed successfully');
});

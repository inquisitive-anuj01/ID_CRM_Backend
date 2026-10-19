import * as userService from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await userService.listUsers(req.query);
  ApiResponse.ok(res, 'Users fetched', users, meta);
});

export const getUserOptions = asyncHandler(async (req, res) => {
  const users = await userService.getUserOptions();
  ApiResponse.ok(res, 'User options', users);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  ApiResponse.ok(res, 'User fetched', user);
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  ApiResponse.created(res, 'User created', user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  ApiResponse.ok(res, 'User updated', user);
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.setUserStatus(req.params.id, req.body.isActive);
  ApiResponse.ok(res, `User ${req.body.isActive ? 'activated' : 'deactivated'}`, user);
});

export const resetPassword = asyncHandler(async (req, res) => {
  await userService.adminResetPassword(req.params.id, req.body.newPassword);
  ApiResponse.ok(res, 'Password reset successfully');
});

export const reassignLeads = asyncHandler(async (req, res) => {
  const result = await userService.reassignLeads(req.params.id, req.body.toUserId);
  ApiResponse.ok(res, 'Leads reassigned', result);
});

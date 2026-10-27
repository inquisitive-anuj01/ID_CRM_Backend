import * as workspaceService from '../services/workspace.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { REFRESH_COOKIE_OPTS } from '../services/auth.service.js';

export const createWorkspace = asyncHandler(async (req, res) => {
  const { workspace, user, accessToken, refreshToken } = await workspaceService.createWorkspace(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
  ApiResponse.created(res, 'Workspace registered successfully', { workspace, user, accessToken });
});

export const getMyWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getWorkspaceById(req.workspace._id);
  ApiResponse.ok(res, 'Workspace fetched', workspace);
});

export const renameWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.renameWorkspace(req.workspace._id, req.body.name);
  ApiResponse.ok(res, 'Workspace renamed successfully', workspace);
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.deleteWorkspace(req.workspace._id, req.user);
  res.clearCookie('refreshToken');
  ApiResponse.ok(res, 'Workspace and all associated records permanently deleted');
});

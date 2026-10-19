import * as dashService from '../services/dashboard.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSummary = asyncHandler(async (req, res) => {
  const data = await dashService.getDashboardSummary(req.user, req.query.userId);
  ApiResponse.ok(res, 'Dashboard summary', data);
});

export const getLeads = asyncHandler(async (req, res) => {
  const data = await dashService.getDashboardLeads(req.user, req.query);
  ApiResponse.ok(res, 'Dashboard leads', data);
});

export const getFollowups = asyncHandler(async (req, res) => {
  const data = await dashService.getDashboardFollowups(req.user, req.query);
  ApiResponse.ok(res, 'Dashboard followups', data);
});

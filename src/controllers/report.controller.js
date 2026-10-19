import * as reportService from '../services/report.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getLeadsSummary = asyncHandler(async (req, res) => {
  const data = await reportService.getLeadsSummaryReport(req.user, req.query);
  ApiResponse.ok(res, 'Leads summary report', data);
});

export const getBySource = asyncHandler(async (req, res) => {
  const data = await reportService.getSourceReport(req.user, req.query);
  ApiResponse.ok(res, 'Source report', data);
});

export const getByUser = asyncHandler(async (req, res) => {
  const data = await reportService.getUserPerformanceReport(req.user, req.query);
  ApiResponse.ok(res, 'User performance report', data);
});

export const getFollowupCompliance = asyncHandler(async (req, res) => {
  const data = await reportService.getFollowupComplianceReport(req.user, req.query);
  ApiResponse.ok(res, 'Followup compliance report', data);
});

export const getOverdue = asyncHandler(async (req, res) => {
  const data = await reportService.getOverdueReport(req.user);
  ApiResponse.ok(res, 'Overdue report', data);
});

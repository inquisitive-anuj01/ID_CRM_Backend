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

export const getConversion = asyncHandler(async (req, res) => {
  const data = await reportService.getConversionReport(req.user, req.query);
  ApiResponse.ok(res, 'Conversion report', data);
});

export const exportReport = asyncHandler(async (req, res) => {
  const { exportLeads } = await import('../services/leadList.service.js');
  const workbook = await exportLeads(req.user, req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="leads_report.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

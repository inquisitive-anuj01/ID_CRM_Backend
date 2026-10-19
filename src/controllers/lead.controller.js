import * as leadService from '../services/lead.service.js';
import * as historyService from '../services/history.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.user, req.body);
  ApiResponse.created(res, 'Lead created successfully', lead);
});

export const getLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.lead._id);
  ApiResponse.ok(res, 'Lead details fetched', lead);
});

export const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.lead, req.user, req.body);
  ApiResponse.ok(res, 'Lead updated successfully', lead);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadStatus(req.lead, req.user, req.body);
  ApiResponse.ok(res, 'Lead status updated successfully', lead);
});

export const assignLead = asyncHandler(async (req, res) => {
  const lead = await leadService.assignLead(req.lead, req.user, req.body.userId);
  ApiResponse.ok(res, 'Lead assigned successfully', lead);
});

export const updateLabels = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadLabels(req.lead, req.user, req.body.labels);
  ApiResponse.ok(res, 'Lead labels updated successfully', lead);
});

export const updateRating = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadRating(req.lead, req.user, req.body.rating);
  ApiResponse.ok(res, 'Lead rating updated successfully', lead);
});

export const deleteLead = asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.lead, req.user);
  ApiResponse.ok(res, 'Lead deleted successfully');
});

export const restoreLead = asyncHandler(async (req, res) => {
  const lead = await leadService.restoreLead(req.params.id, req.user);
  ApiResponse.ok(res, 'Lead restored successfully', lead);
});

export const getLeadHistory = asyncHandler(async (req, res) => {
  const history = await historyService.getLeadHistory(req.lead._id, req.query);
  ApiResponse.ok(res, 'Lead history fetched', history.items, history.meta);
});

export const checkDuplicate = asyncHandler(async (req, res) => {
  const matches = await leadService.checkDuplicate(req.query.mobile, req.query.countryCode);
  ApiResponse.ok(res, 'Duplicate check completed', matches);
});

export const bulkAssign = asyncHandler(async (req, res) => {
  const result = await leadService.bulkAssign(req.body.ids, req.body.userId, req.user);
  ApiResponse.ok(res, 'Leads assigned successfully', result);
});

export const bulkStatus = asyncHandler(async (req, res) => {
  const result = await leadService.bulkStatus(req.body.ids, req.body.status, req.body.cancelReason, req.user);
  ApiResponse.ok(res, 'Lead statuses updated successfully', result);
});

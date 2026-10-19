import path from 'path';
import fs from 'fs';
import * as followupService from '../services/followup.service.js';
import Followup from '../models/Followup.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getFilePath } from '../services/storage.service.js';

export const createFollowup = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const followup = await followupService.createFollowup(req.lead._id, req.user, req.body, files);
  ApiResponse.created(res, 'Followup added successfully', followup);
});

export const listLeadFollowups = asyncHandler(async (req, res) => {
  const followups = await followupService.listLeadFollowups(req.lead._id);
  ApiResponse.ok(res, 'Lead followups fetched', followups);
});

export const updateFollowup = asyncHandler(async (req, res) => {
  const followup = await followupService.updateFollowup(req.params.id, req.user, req.body);
  ApiResponse.ok(res, 'Followup updated successfully', followup);
});

export const deleteFollowup = asyncHandler(async (req, res) => {
  await followupService.deleteFollowup(req.params.id, req.user);
  ApiResponse.ok(res, 'Followup deleted successfully');
});

export const getMyFollowups = asyncHandler(async (req, res) => {
  const followups = await followupService.getMyFollowups(req.user, req.query);
  ApiResponse.ok(res, 'Followups fetched', followups);
});

export const downloadFile = asyncHandler(async (req, res) => {
  const { followupId, fileId } = req.params;
  const followup = await Followup.findById(followupId);
  if (!followup || followup.isDeleted) throw ApiError.notFound('Followup not found');

  const attachment = followup.attachments.id(fileId);
  if (!attachment) throw ApiError.notFound('File not found');

  const filename = path.basename(attachment.url);
  const filePath = getFilePath(filename);

  if (!fs.existsSync(filePath)) {
    throw ApiError.notFound('File does not exist on disk');
  }

  res.download(filePath, attachment.originalName || filename);
});

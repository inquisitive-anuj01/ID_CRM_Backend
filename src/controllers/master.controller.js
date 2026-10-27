import * as masterService from '../services/master.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Statuses
export const getStatuses = asyncHandler(async (req, res) => {
  const includeAll = req.user?.role === 'admin' && req.query.all === 'true';
  const data = await masterService.listStatuses(includeAll, req.workspace?._id);
  ApiResponse.ok(res, 'Statuses fetched', data);
});

export const createStatus = asyncHandler(async (req, res) => {
  const data = await masterService.createStatus(req.body, req.workspace?._id);
  ApiResponse.created(res, 'Status created', data);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await masterService.updateStatus(req.params.id, req.body, req.workspace?._id);
  ApiResponse.ok(res, 'Status updated', data);
});

export const reorderStatuses = asyncHandler(async (req, res) => {
  const data = await masterService.reorderStatuses(req.body.order, req.workspace?._id);
  ApiResponse.ok(res, 'Statuses reordered', data);
});

// Sources
export const getSources = asyncHandler(async (req, res) => {
  const includeAll = req.user?.role === 'admin' && req.query.all === 'true';
  const data = await masterService.listSources(includeAll, req.workspace?._id);
  ApiResponse.ok(res, 'Sources fetched', data);
});

export const createSource = asyncHandler(async (req, res) => {
  const data = await masterService.createSource(req.body, req.workspace?._id);
  ApiResponse.created(res, 'Source created', data);
});

export const updateSource = asyncHandler(async (req, res) => {
  const data = await masterService.updateSource(req.params.id, req.body, req.workspace?._id);
  ApiResponse.ok(res, 'Source updated', data);
});

export const reorderSources = asyncHandler(async (req, res) => {
  const data = await masterService.reorderSources(req.body.order, req.workspace?._id);
  ApiResponse.ok(res, 'Sources reordered', data);
});

// Labels
export const getLabels = asyncHandler(async (req, res) => {
  const includeAll = req.user?.role === 'admin' && req.query.all === 'true';
  const data = await masterService.listLabels(includeAll, req.workspace?._id);
  ApiResponse.ok(res, 'Labels fetched', data);
});

export const createLabel = asyncHandler(async (req, res) => {
  const data = await masterService.createLabel(req.body, req.workspace?._id);
  ApiResponse.created(res, 'Label created', data);
});

export const updateLabel = asyncHandler(async (req, res) => {
  const data = await masterService.updateLabel(req.params.id, req.body, req.workspace?._id);
  ApiResponse.ok(res, 'Label updated', data);
});

export const reorderLabels = asyncHandler(async (req, res) => {
  const data = await masterService.reorderLabels(req.body.order, req.workspace?._id);
  ApiResponse.ok(res, 'Labels reordered', data);
});

// Followup Categories
export const getCategories = asyncHandler(async (req, res) => {
  const includeAll = req.user?.role === 'admin' && req.query.all === 'true';
  const data = await masterService.listCategories(includeAll, req.workspace?._id);
  ApiResponse.ok(res, 'Categories fetched', data);
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = await masterService.createCategory(req.body, req.workspace?._id);
  ApiResponse.created(res, 'Category created', data);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = await masterService.updateCategory(req.params.id, req.body, req.workspace?._id);
  ApiResponse.ok(res, 'Category updated', data);
});

export const reorderCategories = asyncHandler(async (req, res) => {
  const data = await masterService.reorderCategories(req.body.order, req.workspace?._id);
  ApiResponse.ok(res, 'Categories reordered', data);
});

// Settings
export const getSetting = asyncHandler(async (req, res) => {
  const data = await masterService.getSetting(req.workspace?._id);
  ApiResponse.ok(res, 'Settings fetched', data);
});

export const updateSetting = asyncHandler(async (req, res) => {
  const data = await masterService.updateSetting(req.body, req.workspace?._id);
  ApiResponse.ok(res, 'Settings updated', data);
});

export const deleteStatus = asyncHandler(async (req, res) => {
  const data = await masterService.deleteStatus(req.params.id, req.workspace?._id);
  ApiResponse.ok(res, 'Status deleted', data);
});

export const deleteSource = asyncHandler(async (req, res) => {
  const data = await masterService.deleteSource(req.params.id, req.workspace?._id);
  ApiResponse.ok(res, 'Source deleted', data);
});

export const deleteLabel = asyncHandler(async (req, res) => {
  const data = await masterService.deleteLabel(req.params.id, req.workspace?._id);
  ApiResponse.ok(res, 'Label deleted', data);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const data = await masterService.deleteCategory(req.params.id, req.workspace?._id);
  ApiResponse.ok(res, 'Category deleted', data);
});

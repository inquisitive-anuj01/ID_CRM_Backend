import * as masterService from '../services/master.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Statuses
export const getStatuses = asyncHandler(async (req, res) => {
  const includeAll = req.user?.role === 'admin' && req.query.all === 'true';
  const data = await masterService.listStatuses(includeAll);
  ApiResponse.ok(res, 'Statuses fetched', data);
});

export const createStatus = asyncHandler(async (req, res) => {
  const data = await masterService.createStatus(req.body);
  ApiResponse.created(res, 'Status created', data);
});

export const updateStatus = asyncHandler(async (req, res) => {
  const data = await masterService.updateStatus(req.params.id, req.body);
  ApiResponse.ok(res, 'Status updated', data);
});

export const reorderStatuses = asyncHandler(async (req, res) => {
  const data = await masterService.reorderStatuses(req.body.order);
  ApiResponse.ok(res, 'Statuses reordered', data);
});

// Sources
export const getSources = asyncHandler(async (req, res) => {
  const includeAll = req.user?.role === 'admin' && req.query.all === 'true';
  const data = await masterService.listSources(includeAll);
  ApiResponse.ok(res, 'Sources fetched', data);
});

export const createSource = asyncHandler(async (req, res) => {
  const data = await masterService.createSource(req.body);
  ApiResponse.created(res, 'Source created', data);
});

export const updateSource = asyncHandler(async (req, res) => {
  const data = await masterService.updateSource(req.params.id, req.body);
  ApiResponse.ok(res, 'Source updated', data);
});

// Labels
export const getLabels = asyncHandler(async (req, res) => {
  const includeAll = req.user?.role === 'admin' && req.query.all === 'true';
  const data = await masterService.listLabels(includeAll);
  ApiResponse.ok(res, 'Labels fetched', data);
});

export const createLabel = asyncHandler(async (req, res) => {
  const data = await masterService.createLabel(req.body);
  ApiResponse.created(res, 'Label created', data);
});

export const updateLabel = asyncHandler(async (req, res) => {
  const data = await masterService.updateLabel(req.params.id, req.body);
  ApiResponse.ok(res, 'Label updated', data);
});

// Followup Categories
export const getCategories = asyncHandler(async (req, res) => {
  const includeAll = req.user?.role === 'admin' && req.query.all === 'true';
  const data = await masterService.listCategories(includeAll);
  ApiResponse.ok(res, 'Categories fetched', data);
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = await masterService.createCategory(req.body);
  ApiResponse.created(res, 'Category created', data);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = await masterService.updateCategory(req.params.id, req.body);
  ApiResponse.ok(res, 'Category updated', data);
});

// Settings
export const getSetting = asyncHandler(async (req, res) => {
  const data = await masterService.getSetting();
  ApiResponse.ok(res, 'Settings fetched', data);
});

export const updateSetting = asyncHandler(async (req, res) => {
  const data = await masterService.updateSetting(req.body);
  ApiResponse.ok(res, 'Settings updated', data);
});

export const deleteStatus = asyncHandler(async (req, res) => {
  const data = await masterService.deleteStatus(req.params.id);
  ApiResponse.ok(res, 'Status deleted', data);
});

export const deleteSource = asyncHandler(async (req, res) => {
  const data = await masterService.deleteSource(req.params.id);
  ApiResponse.ok(res, 'Source deleted', data);
});

export const deleteLabel = asyncHandler(async (req, res) => {
  const data = await masterService.deleteLabel(req.params.id);
  ApiResponse.ok(res, 'Label deleted', data);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const data = await masterService.deleteCategory(req.params.id);
  ApiResponse.ok(res, 'Category deleted', data);
});

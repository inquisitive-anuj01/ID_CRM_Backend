import { Router } from 'express';
import multer from 'multer';
import * as leadCtrl from '../controllers/lead.controller.js';
import * as leadListService from '../services/leadList.service.js';
import { auth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { leadAccess } from '../middlewares/leadAccess.js';
import { validate } from '../middlewares/validate.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createLeadSchema,
  updateLeadSchema,
  updateStatusSchema,
  assignLeadSchema,
  updateLabelsSchema,
  updateRatingSchema,
  bulkAssignSchema,
  bulkStatusSchema,
} from '../validators/lead.validators.js';

const router = Router();
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(auth);

// ─── Query / Aggregate Routes (Must precede /:id) ───────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const result = await leadListService.listLeads(req.user, req.query);
  ApiResponse.ok(res, 'Leads fetched successfully', result.leads, result.meta);
}));

router.get('/board', asyncHandler(async (req, res) => {
  const board = await leadListService.getLeadsBoard(req.user, req.query);
  ApiResponse.ok(res, 'Leads board fetched successfully', board);
}));

router.get('/check-duplicate', leadCtrl.checkDuplicate);

router.get('/export', asyncHandler(async (req, res) => {
  const workbook = await leadListService.exportLeads(req.user, req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="leads.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
}));

router.post('/import', authorize('admin'), memUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const result = await leadListService.importLeads(req.file.buffer, req.user);
  ApiResponse.ok(res, 'Import completed', result);
}));

router.post('/bulk/assign', authorize('admin'), validate({ body: bulkAssignSchema }), leadCtrl.bulkAssign);
router.post('/bulk/status', validate({ body: bulkStatusSchema }), leadCtrl.bulkStatus);

router.post('/', validate({ body: createLeadSchema }), leadCtrl.createLead);

// ─── Single Lead Actions ─────────────────────────────────────────────────────
router.get('/:id', leadAccess, leadCtrl.getLead);
router.patch('/:id', leadAccess, validate({ body: updateLeadSchema }), leadCtrl.updateLead);
router.patch('/:id/status', leadAccess, validate({ body: updateStatusSchema }), leadCtrl.updateStatus);
router.patch('/:id/assign', leadAccess, validate({ body: assignLeadSchema }), leadCtrl.assignLead);
router.patch('/:id/labels', leadAccess, validate({ body: updateLabelsSchema }), leadCtrl.updateLabels);
router.patch('/:id/rating', leadAccess, validate({ body: updateRatingSchema }), leadCtrl.updateRating);
router.get('/:id/history', leadAccess, leadCtrl.getLeadHistory);
router.delete('/:id', leadAccess, leadCtrl.deleteLead);
router.post('/:id/restore', authorize('admin'), leadCtrl.restoreLead);

export default router;

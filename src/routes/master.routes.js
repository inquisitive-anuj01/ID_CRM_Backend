import { Router } from 'express';
import * as masterCtrl from '../controllers/master.controller.js';
import { auth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import {
  createStatusSchema,
  updateStatusSchema,
  reorderStatusSchema,
  createSourceSchema,
  updateSourceSchema,
  createLabelSchema,
  updateLabelSchema,
  createCategorySchema,
  updateCategorySchema,
  updateSettingSchema,
} from '../validators/master.validators.js';

const router = Router();
router.use(auth);

// Statuses
router.get('/statuses', masterCtrl.getStatuses);
router.post('/statuses', authorize('admin'), validate({ body: createStatusSchema }), masterCtrl.createStatus);
router.patch('/statuses/reorder', authorize('admin'), validate({ body: reorderStatusSchema }), masterCtrl.reorderStatuses);
router.patch('/statuses/:id', authorize('admin'), validate({ body: updateStatusSchema }), masterCtrl.updateStatus);

// Sources
router.get('/sources', masterCtrl.getSources);
router.post('/sources', authorize('admin'), validate({ body: createSourceSchema }), masterCtrl.createSource);
router.patch('/sources/:id', authorize('admin'), validate({ body: updateSourceSchema }), masterCtrl.updateSource);

// Labels
router.get('/labels', masterCtrl.getLabels);
router.post('/labels', authorize('admin'), validate({ body: createLabelSchema }), masterCtrl.createLabel);
router.patch('/labels/:id', authorize('admin'), validate({ body: updateLabelSchema }), masterCtrl.updateLabel);

// Categories
router.get('/followup-categories', masterCtrl.getCategories);
router.post('/followup-categories', authorize('admin'), validate({ body: createCategorySchema }), masterCtrl.createCategory);
router.patch('/followup-categories/:id', authorize('admin'), validate({ body: updateCategorySchema }), masterCtrl.updateCategory);

// Settings
router.get('/settings', masterCtrl.getSetting);
router.patch('/settings', authorize('admin'), validate({ body: updateSettingSchema }), masterCtrl.updateSetting);

export default router;

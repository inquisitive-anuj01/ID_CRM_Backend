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
router.post('/statuses/reorder', authorize('admin'), validate({ body: reorderStatusSchema }), masterCtrl.reorderStatuses);
router.patch('/statuses/:id', authorize('admin'), validate({ body: updateStatusSchema }), masterCtrl.updateStatus);
router.delete('/statuses/:id', authorize('admin'), masterCtrl.deleteStatus);

// Sources
router.get('/sources', masterCtrl.getSources);
router.post('/sources', authorize('admin'), validate({ body: createSourceSchema }), masterCtrl.createSource);
router.patch('/sources/reorder', authorize('admin'), validate({ body: reorderStatusSchema }), masterCtrl.reorderSources);
router.post('/sources/reorder', authorize('admin'), validate({ body: reorderStatusSchema }), masterCtrl.reorderSources);
router.patch('/sources/:id', authorize('admin'), validate({ body: updateSourceSchema }), masterCtrl.updateSource);
router.delete('/sources/:id', authorize('admin'), masterCtrl.deleteSource);

// Labels
router.get('/labels', masterCtrl.getLabels);
router.post('/labels', authorize('admin'), validate({ body: createLabelSchema }), masterCtrl.createLabel);
router.patch('/labels/reorder', authorize('admin'), validate({ body: reorderStatusSchema }), masterCtrl.reorderLabels);
router.post('/labels/reorder', authorize('admin'), validate({ body: reorderStatusSchema }), masterCtrl.reorderLabels);
router.patch('/labels/:id', authorize('admin'), validate({ body: updateLabelSchema }), masterCtrl.updateLabel);
router.delete('/labels/:id', authorize('admin'), masterCtrl.deleteLabel);

// Categories
router.get('/followup-categories', masterCtrl.getCategories);
router.post('/followup-categories', authorize('admin'), validate({ body: createCategorySchema }), masterCtrl.createCategory);
router.patch('/followup-categories/reorder', authorize('admin'), validate({ body: reorderStatusSchema }), masterCtrl.reorderCategories);
router.post('/followup-categories/reorder', authorize('admin'), validate({ body: reorderStatusSchema }), masterCtrl.reorderCategories);
router.patch('/followup-categories/:id', authorize('admin'), validate({ body: updateCategorySchema }), masterCtrl.updateCategory);
router.delete('/followup-categories/:id', authorize('admin'), masterCtrl.deleteCategory);

// Settings
router.get('/settings', masterCtrl.getSetting);
router.patch('/settings', authorize('admin'), validate({ body: updateSettingSchema }), masterCtrl.updateSetting);

// Fallbacks / Aliases
router.get('/services', masterCtrl.getLabels);
router.get('/loss-reasons', (req, res) => {
  const reasons = [
    { _id: '1', name: 'Price too high' },
    { _id: '2', name: 'Bought from competitor' },
    { _id: '3', name: 'Client unresponsive' },
    { _id: '4', name: 'Budget issue' },
    { _id: '5', name: 'Postponed project' },
    { _id: '6', name: 'Requirement mismatch' },
    { _id: '7', name: 'Other' },
  ];
  res.json({ success: true, message: 'Loss reasons fetched', data: reasons });
});

export default router;

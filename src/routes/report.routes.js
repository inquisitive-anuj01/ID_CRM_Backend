import { Router } from 'express';
import * as reportCtrl from '../controllers/report.controller.js';
import { auth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();
router.use(auth);

router.get('/leads-summary', reportCtrl.getLeadsSummary);
router.get('/by-status', reportCtrl.getLeadsSummary);
router.get('/conversion', reportCtrl.getConversion);
router.get('/by-source', reportCtrl.getBySource);
router.get('/by-user', authorize('admin'), reportCtrl.getByUser);
router.get('/followup-compliance', reportCtrl.getFollowupCompliance);
router.get('/compliance', reportCtrl.getFollowupCompliance);
router.get('/overdue', reportCtrl.getOverdue);
router.get('/export', reportCtrl.exportReport);

export default router;

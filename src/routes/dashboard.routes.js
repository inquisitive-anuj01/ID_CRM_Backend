import { Router } from 'express';
import * as dashCtrl from '../controllers/dashboard.controller.js';
import { auth } from '../middlewares/auth.js';

const router = Router();
router.use(auth);

router.get('/summary', dashCtrl.getSummary);
router.get('/stats', dashCtrl.getSummary);
router.get('/leads', dashCtrl.getLeads);
router.get('/pipeline', dashCtrl.getLeads);
router.get('/followups', dashCtrl.getFollowups);
router.get('/schedules', dashCtrl.getFollowups);

export default router;

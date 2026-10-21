import { Router } from 'express';
import * as followupCtrl from '../controllers/followup.controller.js';
import { auth } from '../middlewares/auth.js';
import { leadAccess } from '../middlewares/leadAccess.js';
import { upload } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { createFollowupSchema, updateFollowupSchema } from '../validators/followup.validators.js';

const router = Router();
router.use(auth);

// Lead-scoped followup routes
router.get('/leads/:id/followups', leadAccess, followupCtrl.listLeadFollowups);
router.post(
  '/leads/:id/followups',
  leadAccess,
  upload.array('files', 5),
  validate({ body: createFollowupSchema }),
  followupCtrl.createFollowup
);

// General followup actions
router.get('/followups/daily-agenda', (req, res, next) => {
  req.query.when = req.query.when || 'today';
  return followupCtrl.getMyFollowups(req, res, next);
});
router.patch('/followups/:id', validate({ body: updateFollowupSchema }), followupCtrl.updateFollowup);
router.delete('/followups/:id', followupCtrl.deleteFollowup);
router.get('/followups', followupCtrl.getMyFollowups);

// Authenticated file download
router.get('/files/:followupId/:fileId', followupCtrl.downloadFile);

export default router;

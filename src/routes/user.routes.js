import { Router } from 'express';
import * as userCtrl from '../controllers/user.controller.js';
import { auth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import {
  createUserSchema,
  updateUserSchema,
  userStatusSchema,
  resetPasswordSchema,
  reassignLeadsSchema,
} from '../validators/user.validators.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Available to all authenticated users (for assign dropdown)
router.get('/options', userCtrl.getUserOptions);

// Admin-only routes
router.get('/', authorize('admin'), userCtrl.listUsers);
router.post('/', authorize('admin'), validate({ body: createUserSchema }), userCtrl.createUser);
router.get('/:id', authorize('admin'), userCtrl.getUser);
router.patch('/:id', authorize('admin'), validate({ body: updateUserSchema }), userCtrl.updateUser);
router.patch('/:id/status', authorize('admin'), validate({ body: userStatusSchema }), userCtrl.setUserStatus);
router.patch('/:id/activate', authorize('admin'), userCtrl.activateUser);
router.patch('/:id/deactivate', authorize('admin'), userCtrl.deactivateUser);
router.patch('/:id/reset-password', authorize('admin'), validate({ body: resetPasswordSchema }), userCtrl.resetPassword);
router.post('/:id/reset-password', authorize('admin'), validate({ body: resetPasswordSchema }), userCtrl.resetPassword);
router.post('/:id/reassign-leads', authorize('admin'), validate({ body: reassignLeadsSchema }), userCtrl.reassignLeads);

export default router;

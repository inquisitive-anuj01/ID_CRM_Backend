import { Router } from 'express';
import * as workspaceCtrl from '../controllers/workspace.controller.js';
import { auth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';

const router = Router();

// Public route to register new workspace + initial admin
router.post('/create', workspaceCtrl.createWorkspace);

// Authenticated routes
router.use(auth);

router.get('/me', workspaceCtrl.getMyWorkspace);
router.patch('/rename', authorize('admin'), workspaceCtrl.renameWorkspace);
router.delete('/', authorize('admin'), workspaceCtrl.deleteWorkspace);

export default router;

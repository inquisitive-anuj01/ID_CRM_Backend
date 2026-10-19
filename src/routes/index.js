import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import masterRoutes from './master.routes.js';
import leadRoutes from './lead.routes.js';
import followupRoutes from './followup.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import reportRoutes from './report.routes.js';
import notificationRoutes from './notification.routes.js';
import searchRoutes from './search.routes.js';
import phase2Routes from './phase2.routes.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  ApiResponse.ok(res, '365 CRM API is healthy', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/', masterRoutes);
router.use('/leads', leadRoutes);
router.use('/', followupRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/', phase2Routes);

export default router;

import { Router } from 'express';
import * as notifService from '../services/notification.service.js';
import { auth } from '../middlewares/auth.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(auth);

router.get('/', asyncHandler(async (req, res) => {
  const data = await notifService.listNotifications(req.user._id, req.query);
  ApiResponse.ok(res, 'Notifications fetched', data.notifications, {
    ...data.meta,
    unreadCount: data.unreadCount,
  });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const data = await notifService.markAsRead(req.user._id, req.params.id);
  ApiResponse.ok(res, 'Notification marked as read', data);
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  const data = await notifService.markAllAsRead(req.user._id);
  ApiResponse.ok(res, 'All notifications marked as read', data);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await notifService.deleteNotification(req.user._id, req.params.id);
  ApiResponse.ok(res, 'Notification deleted');
}));

export default router;

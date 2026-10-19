import Notification from '../models/Notification.model.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import { emitToUser } from '../sockets/index.js';

export const createNotification = async ({ userId, type, title, body, link = {} }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      body,
      link,
    });

    // Realtime notification via Socket
    emitToUser(userId.toString(), 'notification:new', notification);

    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

export const listNotifications = async (userId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: userId };
  if (query.unreadOnly === 'true') {
    filter.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    meta: buildMeta(total, page, limit),
  };
};

export const markAsRead = async (userId, notificationId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return { success: true };
};

export const deleteNotification = async (userId, notificationId) => {
  await Notification.findOneAndDelete({ _id: notificationId, user: userId });
  return { success: true };
};

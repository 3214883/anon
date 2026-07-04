import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotificationById,
  getUnreadCount
} from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 应用认证中间件
router.use(authMiddleware);

// 通知相关路由
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:notificationId/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotificationById);

export default router;

import { Request, Response } from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount
} from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 50, offset = 0 } = req.query;
    
    const { notifications, total } = await getUserNotifications(
      userId,
      parseInt(String(Array.isArray(limit) ? limit[0] : limit)),
      parseInt(String(Array.isArray(offset) ? offset[0] : offset))
    );
    
    res.json({
      success: true,
      data: {
        notifications,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;
    
    const notification = await markNotificationAsRead(
      parseInt(notificationId as string),
      userId
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const count = await markAllNotificationsAsRead(userId);
    
    res.json({
      success: true,
      message: `已标记 ${count} 条通知为已读`,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteNotificationById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;
    
    const success = await deleteNotification(
      parseInt(notificationId as string),
      userId
    );
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: '通知删除成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const count = await getUnreadNotificationCount(userId);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

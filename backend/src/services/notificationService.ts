import { dataSource } from '../config/database';
import { Notification } from '../models/Notification';

const notificationRepository = dataSource.getRepository(Notification);

// 发送通知
export const sendNotification = async (
  userId: number,
  type: string,
  title: string,
  content: string
): Promise<Notification> => {
  console.log('Sending notification to user:', userId);
  if (!userId || userId === 0) {
    throw new Error('Invalid userId');
  }
  
  // 创建通知对象
  const notification = new Notification();
  notification.userId = userId;
  notification.type = type;
  notification.title = title;
  notification.content = content;
  notification.isRead = false;
  
  return await notificationRepository.save(notification);
};

// 批量发送通知
export const sendBulkNotifications = async (
  userIds: number[],
  type: string,
  title: string,
  content: string
): Promise<Notification[]> => {
  const notifications = userIds.map(userId => {
    const notification = new Notification();
    notification.userId = userId;
    notification.type = type;
    notification.title = title;
    notification.content = content;
    notification.isRead = false;
    return notification;
  });
  
  return await notificationRepository.save(notifications);
};

// 获取用户的通知列表
export const getUserNotifications = async (
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<{ notifications: Notification[]; total: number }> => {
  const [notifications, total] = await notificationRepository.findAndCount({
    where: { userId },
    order: { createdAt: 'DESC' },
    take: limit,
    skip: offset
  });
  
  return { notifications, total };
};

// 标记通知为已读
export const markNotificationAsRead = async (notificationId: number, userId: number): Promise<Notification | null> => {
  const notification = await notificationRepository.findOne({
    where: { id: notificationId, userId }
  });
  
  if (!notification) {
    return null;
  }
  
  notification.isRead = true;
  return await notificationRepository.save(notification);
};

// 标记所有通知为已读
export const markAllNotificationsAsRead = async (userId: number): Promise<number> => {
  const result = await notificationRepository.update(
    { userId, isRead: false },
    { isRead: true }
  );
  
  return result.affected || 0;
};

// 删除通知
export const deleteNotification = async (notificationId: number, userId: number): Promise<boolean> => {
  const result = await notificationRepository.delete({
    id: notificationId,
    userId
  });
  
  return result.affected !== 0;
};

// 获取未读通知数量
export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
  return await notificationRepository.count({
    where: { userId, isRead: false }
  });
};

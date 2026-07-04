import api from './index';

// 活动相关接口
export const eventService = {
  // 获取活动列表
  getEvents: (params?: { category?: string; page?: number; limit?: number }) => {
    console.log('Calling getEvents with params:', params);
    return api.get('/events', { params });
  },

  // 获取近期活动（未来3天内）
  getUpcomingEvents: () => {
    return api.get('/events/upcoming');
  },

  // 获取活动详情
  getEvent: (id: number) => {
    return api.get(`/events/${id}`);
  },

  // 创建活动
  createEvent: (data: any) => {
    return api.post('/events', data);
  },

  // 更新活动
  updateEvent: (id: number, data: any) => {
    return api.put(`/events/${id}`, data);
  },

  // 删除活动
  deleteEvent: (id: number) => {
    return api.delete(`/events/${id}`);
  },

  // 搜索活动
  searchEvents: (keyword: string) => {
    return api.get('/events/search', { params: { keyword } });
  }
};

// 报名相关接口
export const registrationService = {
  // 报名活动
  register: (data: any) => {
    return api.post('/registrations', data);
  },

  // 获取用户报名列表
  getUserRegistrations: () => {
    return api.get('/registrations/me');
  },

  // 取消报名
  cancelRegistration: (id: number) => {
    return api.delete(`/registrations/${id}`);
  },

  // 获取报名详情
  getRegistration: (id: number) => {
    return api.get(`/registrations/${id}`);
  }
};

// 支付相关接口
export const paymentService = {
  // 创建支付订单
  createPayment: (data: any) => {
    return api.post('/payments', data);
  },

  // 获取支付状态
  getPaymentStatus: (id: number) => {
    return api.get(`/payments/${id}/status`);
  },

  // 退款
  refund: (id: number) => {
    return api.post(`/payments/${id}/refund`);
  }
};

// 门票相关接口
export const ticketService = {
  // 获取用户门票
  getUserTickets: () => {
    return api.get('/tickets');
  },

  // 获取门票详情
  getTicket: (id: number) => {
    return api.get(`/tickets/${id}`);
  },

  // 签到
  checkin: (ticketId: number) => {
    return api.post(`/tickets/${ticketId}/checkin`);
  }
};

// 社交相关接口
export const socialService = {
  // 点赞活动
  likeEvent: (eventId: number) => {
    return api.post(`/interaction/events/${eventId}/like`);
  },

  // 取消点赞
  unlikeEvent: (eventId: number) => {
    return api.delete(`/interaction/events/${eventId}/like`);
  },

  // 收藏活动
  favoriteEvent: (eventId: number) => {
    return api.post(`/interaction/events/${eventId}/favorite`);
  },

  // 取消收藏
  unfavoriteEvent: (eventId: number) => {
    return api.delete(`/interaction/events/${eventId}/favorite`);
  },

  // 获取用户收藏
  getUserFavorites: () => {
    return api.get('/user-center/favorites');
  },

  // 获取用户点赞
  getUserLikes: () => {
    return api.get('/user-center/likes');
  }
};

// 评论相关接口
export const commentService = {
  // 发表评论
  createComment: (eventId: number, data: { content: string; parentId?: number }) => {
    return api.post(`/interaction/events/${eventId}/comments`, data);
  },

  // 获取活动评论
  getEventComments: (eventId: number) => {
    return api.get(`/interaction/events/${eventId}/comments`);
  },

  // 点赞评论
  likeComment: (commentId: number) => {
    return api.post(`/interaction/comments/${commentId}/like`);
  },

  // 删除评论
  deleteComment: (commentId: number) => {
    return api.delete(`/interaction/comments/${commentId}`);
  }
};

// 好友相关接口
export const friendService = {
  // 发送好友请求
  sendFriendRequest: (friendId: number) => {
    return api.post('/friends', { friendId });
  },

  // 接受好友请求
  acceptFriendRequest: (id: number) => {
    return api.put(`/friends/${id}/accept`);
  },

  // 拒绝好友请求
  rejectFriendRequest: (id: number) => {
    return api.put(`/friends/${id}/reject`);
  },

  // 获取好友列表
  getFriends: () => {
    return api.get('/friends');
  },

  // 获取好友请求
  getFriendRequests: () => {
    return api.get('/friends/requests');
  },

  // 删除好友
  deleteFriend: (id: number) => {
    return api.delete(`/friends/${id}`);
  }
};

// 消息相关接口
export const messageService = {
  // 获取聊天室
  getChats: (eventId: number) => {
    return api.get(`/events/${eventId}/chats`);
  },

  // 获取聊天消息
  getMessages: (chatId: number) => {
    return api.get(`/chats/${chatId}/messages`);
  },

  // 发送消息
  sendMessage: (chatId: number, content: string) => {
    return api.post(`/chats/${chatId}/messages`, { content });
  }
};

// 通知相关接口
export const notificationService = {
  // 获取通知
  getNotifications: () => {
    return api.get('/notifications');
  },

  // 标记通知为已读
  markAsRead: (id: number) => {
    return api.put(`/notifications/${id}/read`);
  },

  // 标记所有通知为已读
  markAllAsRead: () => {
    return api.put('/notifications/read-all');
  }
};

// 用户相关接口
export const userService = {
  // 登录
  login: (data: { email: string; password: string }) => {
    return api.post('/users/login', data);
  },

  // 注册
  register: (data: { username: string; email: string; phone: string; password: string }) => {
    return api.post('/users/register', data);
  },

  // 获取用户信息
  getUserInfo: () => {
    return api.get('/users/me');
  },

  // 更新用户信息
  updateUserInfo: (data: any) => {
    return api.put('/users/me', data);
  },

  // 上传头像
  uploadAvatar: (formData: FormData) => {
    return api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// 文件相关接口
export const fileService = {
  // 上传文件
  uploadFile: (formData: FormData) => {
    return api.post('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // 删除文件
  deleteFile: (id: number) => {
    return api.delete(`/files/${id}`);
  }
};

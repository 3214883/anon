<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()

const notifications = ref<any[]>([])
const loading = ref(true)
const unreadCount = ref(0)
const profile = ref({
  name: ''
})

const loadNotifications = async () => {
  try {
    loading.value = true
    const response = await api.get('/notifications')
    if (response.success && response.data) {
      notifications.value = response.data.notifications
    }
  } catch (error: any) {
    console.error('Error loading notifications:', error)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (notificationId: number) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`)
    if (response.success) {
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.isRead = true
        unreadCount.value--
      }
    }
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
  }
}

const markAllAsRead = async () => {
  try {
    const response = await api.put('/notifications/read-all')
    if (response.success) {
      notifications.value.forEach(notification => {
        notification.isRead = true
      })
      unreadCount.value = 0
    }
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
  }
}

const deleteNotification = async (notificationId: number, event: Event) => {
  event.stopPropagation()
  try {
    const response = await api.delete(`/notifications/${notificationId}`)
    if (response.success) {
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        const notification = notifications.value[index]
        if (!notification.isRead) {
          unreadCount.value--
        }
        notifications.value.splice(index, 1)
      }
    }
  } catch (error: any) {
    console.error('Error deleting notification:', error)
  }
}

const getUnreadCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count')
    if (response.success && response.data) {
      unreadCount.value = response.data.count
    }
  } catch (error: any) {
    console.error('Error getting unread count:', error)
  }
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString()
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}

const logout = () => {
  localStorage.removeItem('user')
  window.dispatchEvent(new CustomEvent('userLoggedOut'))
  router.push('/login')
}

onMounted(() => {
  // 加载用户信息
  const userData = localStorage.getItem('user')
  if (userData) {
    const user = JSON.parse(userData)
    profile.value.name = user.name || ''
  }

  loadNotifications()
  getUnreadCount()
})
</script>

<template>
  <div class="notifications-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <div class="container">
        <div class="nav-left">
          <a href="/" class="logo">{{ $t('appName') }}</a>
          <div class="nav-links">
            <a href="/" class="nav-link">{{ $t('home') }}</a>
            <a href="/events" class="nav-link">{{ $t('events') }}</a>
          </div>
        </div>
        <div class="nav-right">
          <div class="user-menu">
            <span class="user-name">{{ profile.name }}</span>
            <button class="logout-button" @click="logout">退出登录</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <button class="back-button" @click="goBack">
            &lt; {{ $t('back') }}
          </button>
          <h1 class="page-title">{{ t('notifications') }}</h1>
          <div class="header-actions">
            <button v-if="notifications.length > 0" class="action-button" @click="markAllAsRead">
              {{ t('markAllAsRead') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <div class="container">
        <div class="content-wrapper">
          <!-- 左侧导航 -->
          <div class="sidebar">
            <h3 class="sidebar-title">功能导航</h3>
            <div class="menu-section">
              <div class="menu-item" @click="router.push('/profile')">
                <div class="menu-icon">👤</div>
                <div class="menu-title">个人资料</div>
              </div>
              <div class="menu-item" @click="router.push('/my-events?type=created')">
                <div class="menu-icon">📅</div>
                <div class="menu-title">我创建的</div>
              </div>
              <div class="menu-item" @click="router.push('/my-events?type=joined')">
                <div class="menu-icon">🎯</div>
                <div class="menu-title">我参加的</div>
              </div>
              <div class="menu-item active" @click="router.push('/notifications')">
                <div class="menu-icon">🔔</div>
                <div class="menu-title">消息</div>
              </div>
              <div class="menu-item" @click="router.push('/settings')">
                <div class="menu-icon">⚙️</div>
                <div class="menu-title">设置</div>
              </div>
            </div>
          </div>

          <!-- 右侧内容 -->
          <div class="profile-content">
            <!-- 未读计数 -->
            <div v-if="unreadCount > 0" class="unread-count">
              {{ t('unreadNotifications', { count: unreadCount }) }}
            </div>

            <!-- 通知列表 -->
            <div v-if="loading" class="loading">
              <div class="spinner"></div>
              <p>{{ t('loading') }}</p>
            </div>
            <div v-else-if="notifications.length === 0" class="empty-state">
              <div class="empty-icon">📭</div>
              <p>{{ t('noNotifications') }}</p>
            </div>
            <div v-else class="notifications-list">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="notification-item"
                :class="{ 'unread': !notification.isRead }"
                @click="markAsRead(notification.id)"
              >
                <div class="notification-header">
                  <h3>{{ notification.title }}</h3>
                  <div class="notification-actions">
                    <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                    <button class="delete-button" @click="deleteNotification(notification.id, $event)">
                      🗑️
                    </button>
                  </div>
                </div>
                <p class="notification-content">{{ notification.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-page {
  min-height: 100vh;
  background: #f5f7fa;
  color: #333;
}

/* 顶部导航 */
.top-nav {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #42b883;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #42b883;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.logout-button {
  padding: 0.5rem 1rem;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  color: #c62828;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: #ffcdd2;
  border-color: #ef5350;
  transform: translateY(-2px);
}

/* 页面标题 */
.page-header {
  background: white;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
}

.back-button {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
}

.back-button:hover {
  color: #42b883;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  padding: 0.5rem 1rem;
  background: #e8f5e8;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  color: #2e7d32;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button:hover {
  background: #c8e6c9;
  border-color: #42b883;
  transform: translateY(-2px);
}

/* 主要内容 */
.main-content {
  padding-bottom: 4rem;
}

/* 内容包装器 */
.content-wrapper {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

/* 左侧导航 */
.sidebar {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 250px;
  flex-shrink: 0;
  position: sticky;
  top: 100px;
  height: fit-content;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333;
  text-decoration: none;
}

.menu-item:hover {
  background: #f5f7fa;
  transform: translateX(5px);
}

.menu-item.active {
  background: #42b883;
  color: white;
}

.menu-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.menu-title {
  font-weight: 500;
}

/* 右侧内容 */
.profile-content {
  flex: 1;
  min-width: 0;
}

/* 未读计数 */
.unread-count {
  background: #fff8e1;
  border: 1px solid #ffcc80;
  border-radius: 12px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #ef6c00;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 加载和错误状态 */
.loading, .empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #666;
  font-size: 1.125rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  max-width: 600px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-left-color: #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ccc;
}

/* 通知列表 */
.notifications-list {
  margin-top: 1rem;
}

.notification-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-item:hover {
  background: #f9f9f9;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.notification-item.unread {
  background: #f1f8e9;
  border-left-color: #42b883;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.2);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.notification-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
  color: #333;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.notification-time {
  font-size: 0.75rem;
  color: #999;
  white-space: nowrap;
}

.delete-button {
  background: none;
  border: none;
  color: #999;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.delete-button:hover {
  background: #ffebee;
  color: #e74c3c;
}

.notification-content {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-left {
    gap: 1rem;
  }

  .nav-links {
    display: none;
  }

  .content-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: static;
  }

  .menu-section {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .menu-item {
    flex-shrink: 0;
    min-width: 120px;
  }

  .notification-item {
    padding: 1.25rem;
    margin-bottom: 0.75rem;
  }
}
</style>

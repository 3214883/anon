<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { tokenManager } from '../utils/tokenManager'

const { t } = useI18n()
const router = useRouter()

const profile = ref({
  name: ''
})

const followers = ref<any[]>([])
const following = ref<any[]>([])
const activeTab = ref('followers')
const loading = ref(false)

interface User {
  id: number
  name: string
  avatar: string
  bio: string
}

onMounted(() => {
  // 检查用户是否登录
  const userData = localStorage.getItem('user')
  const accessToken = tokenManager.getAccessToken()
  if (!userData || !accessToken) {
    router.push('/login')
    return
  }

  // 加载用户信息
  if (userData) {
    const user = JSON.parse(userData)
    profile.value.name = user.name || ''
  }

  // 模拟加载关注数据
  loadFollowData()
})

const loadFollowData = () => {
  loading.value = true

  // 模拟数据
  setTimeout(() => {
    followers.value = [
      {
        id: 1,
        name: '张三',
        avatar: '',
        bio: '热爱旅行的摄影师'
      },
      {
        id: 2,
        name: '李四',
        avatar: '',
        bio: '美食爱好者'
      },
      {
        id: 3,
        name: '王五',
        avatar: '',
        bio: '健身达人'
      }
    ]

    following.value = [
      {
        id: 4,
        name: '赵六',
        avatar: '',
        bio: '科技博主'
      },
      {
        id: 5,
        name: '钱七',
        avatar: '',
        bio: '音乐制作人'
      }
    ]

    loading.value = false
  }, 500)
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
</script>

<template>
  <div class="followers-page">
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
          <h1 class="page-title">关注</h1>
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
              <div class="menu-item" @click="router.push('/notifications')">
                <div class="menu-icon">🔔</div>
                <div class="menu-title">消息</div>
              </div>
              <div class="menu-item active" @click="router.push('/followers')">
                <div class="menu-icon">👥</div>
                <div class="menu-title">关注</div>
              </div>
              <div class="menu-item" @click="router.push('/settings')">
                <div class="menu-icon">⚙️</div>
                <div class="menu-title">设置</div>
              </div>
            </div>
          </div>

          <!-- 右侧内容 -->
          <div class="profile-content">
            <!-- 标签页 -->
            <div class="tab-container">
              <button
                class="tab-button"
                :class="{ active: activeTab === 'followers' }"
                @click="activeTab = 'followers'"
              >
                粉丝 ({{ followers.length }})
              </button>
              <button
                class="tab-button"
                :class="{ active: activeTab === 'following' }"
                @click="activeTab = 'following'"
              >
                关注 ({{ following.length }})
              </button>
            </div>

            <!-- 关注列表 -->
            <div v-if="loading" class="loading">
              <div class="spinner"></div>
              <p>{{ t('loading') }}</p>
            </div>
            <div v-else-if="(activeTab === 'followers' && followers.length === 0) || (activeTab === 'following' && following.length === 0)" class="empty-state">
              <div class="empty-icon">👥</div>
              <p>{{ activeTab === 'followers' ? '暂无粉丝' : '暂无关注' }}</p>
            </div>
            <div v-else class="follow-list">
              <div
                v-for="user in activeTab === 'followers' ? followers : following"
                :key="user.id"
                class="follow-item"
              >
                <div class="user-avatar">
                  <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
                  <div v-else class="avatar-placeholder">
                    {{ user.name.charAt(0) }}
                  </div>
                </div>
                <div class="user-info">
                  <h4 class="user-name">{{ user.name }}</h4>
                  <p class="user-bio">{{ user.bio }}</p>
                </div>
                <div class="follow-actions">
                  <button class="btn btn-primary">
                    {{ activeTab === 'followers' ? '回关' : '已关注' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.followers-page {
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
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 标签页 */
.tab-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 1rem;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.tab-button:hover {
  color: #42b883;
}

.tab-button.active {
  color: #42b883;
  border-bottom-color: #42b883;
}

/* 加载和错误状态 */
.loading, .empty-state {
  text-align: center;
  padding: 4rem 0;
  color: #666;
  font-size: 1.125rem;
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

/* 关注列表 */
.follow-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.follow-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.follow-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #666;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.user-bio {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
  line-height: 1.4;
}

.follow-actions {
  flex-shrink: 0;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover {
  background: #38a169;
  transform: translateY(-2px);
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

  .follow-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .follow-actions {
    align-self: flex-end;
  }
}
</style>

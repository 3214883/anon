<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../api'

const { t, locale } = useI18n()
const router = useRouter()

interface UserProfile {
  name: string
  email: string
  bio: string
  location: string
  website: string
  joinedDate: string
  avatar: string
  coverImage: string
  points: number
  vipLevel: string
  phone: string
  contact: string
}

const profile = ref<UserProfile>({
  name: '',
  email: '',
  bio: '',
  location: '',
  website: '',
  joinedDate: new Date().toISOString().split('T')[0] || '',
  avatar: '',
  coverImage: '',
  points: 504,
  vipLevel: 'VIP',
  phone: '',
  contact: ''
})

interface MenuItem {
  icon: string
  title: string
  route: string
}

const currentUser = computed(() => {
  const userData = localStorage.getItem('user')
  return userData ? JSON.parse(userData) : null
})

const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    {
      icon: '🎯',
      title: t('myCreatedEvents'),
      route: '/my-events?type=created'
    },
    {
      icon: '👥',
      title: t('myJoinedEvents'),
      route: '/my-events?type=joined'
    },
    {
      icon: '💳',
      title: '我的钱包',
      route: '/wallet'
    }
  ]

  if (currentUser.value?.role === 'admin' || currentUser.value?.isOrganizer) {
    items.push({
      icon: '💰',
      title: '结算管理',
      route: '/settlement-management'
    })
  }

  items.push(
    {
      icon: '🔐',
      title: '修改密码',
      route: '/change-password'
    },
    {
      icon: '💬',
      title: '消息',
      route: '/messages'
    },
    {
      icon: '👤',
      title: '关注',
      route: '/followers'
    }
  )

  return items
})

interface StatItem {
  icon: string
  title: string
  value: number | string
  color: string
  route?: string
}

const stats = ref<StatItem[]>([
  {
    icon: '💰',
    title: '我的钱包',
    value: '查看',
    color: '#ffd54f',
    route: '/wallet'
  },
  {
    icon: '❤️',
    title: '我的点赞',
    value: '查看',
    color: '#f8bbd0',
    route: '/my-likes'
  },
  {
    icon: '💛',
    title: '我的收藏',
    value: '查看',
    color: '#ffcc80',
    route: '/my-favorites'
  },
  {
    icon: '⭐',
    title: '我的评分',
    value: '查看',
    color: '#b3e5fc',
    route: '/my-ratings'
  },
  {
    icon: '💬',
    title: '我的评论',
    value: '查看',
    color: '#c8e6c9',
    route: '/my-comments'
  }
])

const navigateToStat = (route: string) => {
  if (route) {
    router.push(route)
  }
}

// 检查是否为管理员，如果是则跳转到首页
const checkAdminRedirect = () => {
  const userData = localStorage.getItem('user')
  if (userData) {
    const user = JSON.parse(userData)
    if (user.role === 'admin') {
      router.push('/')
      return true
    }
  }
  return false
}

// 加载用户信息
onMounted(async () => {
  if (checkAdminRedirect()) {
    return
  }
  const userData = localStorage.getItem('user')
  if (!userData) {
    router.push('/login')
    return
  }
  // 强制刷新：删除旧的localStorage用户数据，从API重新获取完整数据
  localStorage.removeItem('user')
  await loadUserInfo()
  // 监听个人资料更新事件
  window.addEventListener('profileUpdated', handleProfileUpdated)
  // 监听社交数据更新事件
  window.addEventListener('socialDataUpdated', loadUserStats)
})

// 每次页面激活时重新加载数据
onActivated(async () => {
  if (checkAdminRedirect()) {
    return
  }
  console.log('=== 页面激活，重新加载数据 ===')
  await loadUserInfo()
  loadWalletBalance()
  loadUserStats()
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('profileUpdated', handleProfileUpdated)
  window.removeEventListener('socialDataUpdated', loadUserStats)
})

const logout = () => {
  localStorage.removeItem('user')
  // 触发登出成功事件，通知其他组件更新状态
  window.dispatchEvent(new CustomEvent('userLoggedOut'))
  router.push('/login')
}

const loadWalletBalance = async () => {
  try {
    const response = await api.get('/wallet/balance')
    if (response.success) {
      const balance = Number(response.data.balance) || 0
      stats.value[0].value = `¥${balance.toFixed(2)}`
    }
  } catch (err) {
    console.error('加载钱包余额失败:', err)
  }
}

const loadUserStats = async () => {
  try {
    console.log('=== 开始加载用户统计数据 ===')
    const response = await api.get('/user-center/stats')
    console.log('User stats response:', response)
    if (response && response.success && response.data) {
      console.log('User stats data:', response.data)
      // 直接显示后端返回的点赞数量
      stats.value[1].value = response.data.likes || 0
      stats.value[2].value = response.data.favorites || 0
      stats.value[3].value = response.data.ratings || 0
      stats.value[4].value = response.data.comments || 0
      console.log('Updated stats:', stats.value)
    } else {
      console.error('Invalid response structure:', response)
    }
  } catch (err) {
    console.error('Error loading user stats:', err)
  }
}

const loadUserInfo = async () => {
  try {
    // 从后端API获取最新的用户信息（数据库中的真实数据）
    const response = await api.get('/users/me')
    console.log('🔴 API原始响应:', response)
    console.log('🔴 response.data所有key:', Object.keys(response.data))
    console.log('🔴 response.data.coverImage:', response.data.coverImage ? '有值' : '空')

    if (response.success && response.data) {
      const user = response.data
      profile.value = {
        ...profile.value,
        name: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        contact: user.contact || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || '',
        coverImage: user.coverImage || ''
      }
      console.log('🔴 赋值后 profile.value.coverImage:', profile.value.coverImage ? '有值' : '空')
      // 同时更新localStorage
      localStorage.setItem('user', JSON.stringify(user))
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
  loadUserStats()
  loadWalletBalance()
}

const handleProfileUpdated = async () => {
  await loadUserInfo()
}

const navigateTo = (route: string) => {
  router.push(route)
}

const editProfile = () => {
  // 跳转到编辑个人资料页面
  router.push('/edit-profile')
}

const changePassword = () => {
  // 跳转到修改密码页面
  router.push('/settings')
}
</script>

<template>
  <div class="profile-page">
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

    <!-- 网易云风格大封面 -->
    <div class="profile-header" :style="{
      backgroundImage: profile.coverImage ? `url(${profile.coverImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }">
      <div class="header-overlay"></div>
      <div class="container header-content">
        <!-- 头像悬浮 -->
        <div class="profile-avatar-wrapper">
          <div class="profile-avatar">
            <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.name" />
            <div v-else class="avatar-placeholder">
              {{ profile.name.charAt(0) || '?' }}
            </div>
          </div>
        </div>

        <!-- 用户信息 -->
        <div class="profile-info">
          <h1 class="profile-name">{{ profile.name }}</h1>
          <p class="profile-bio" v-if="profile.bio">{{ profile.bio }}</p>
          <p class="profile-location" v-if="profile.location">
            <span>📍</span> {{ profile.location }}
          </p>
        </div>

        <!-- 操作按钮 -->
        <div class="profile-actions">
          <button class="btn btn-edit" @click="editProfile">
            ✏️ 编辑资料
          </button>
          <button class="btn btn-light" @click="changePassword">
            🔑 修改密码
          </button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="stat-card clickable"
            :style="{ borderLeftColor: stat.color }"
            @click="navigateToStat(stat.route)"
          >
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
            <div class="stat-arrow">›</div>
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
              <div v-for="(item, index) in menuItems" :key="index" class="menu-item" @click="navigateTo(item.route)">
                <div class="menu-icon">{{ item.icon }}</div>
                <div class="menu-title">{{ item.title }}</div>
              </div>
            </div>
          </div>

          <!-- 右侧个人信息 -->
          <div class="profile-content">
            <h3 class="section-title">个人信息</h3>
            <div class="profile-info-card">
              <div class="info-row">
                <div class="info-label">用户名</div>
                <div class="info-value">{{ profile.name }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">邮箱</div>
                <div class="info-value">{{ profile.email }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">电话</div>
                <div class="info-value">{{ profile.phone || '未设置' }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">联系方式</div>
                <div class="info-value">{{ profile.contact || '未设置' }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">个人简介</div>
                <div class="info-value">{{ profile.bio || '未设置' }}</div>
              </div>
              <div class="info-row">
                <div class="info-label">加入日期</div>
                <div class="info-value">{{ profile.joinedDate }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
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

/* 网易云风格大封面 */
.profile-header {
  width: 100%;
  height: 280px;
  background-size: cover;
  background-position: center;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  margin-bottom: 80px;
}

.header-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%);
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  height: 100%;
  padding-bottom: 20px;
  gap: 24px;
}

/* 悬浮头像 - 经典网易云效果 */
.profile-avatar-wrapper {
  position: relative;
  margin-bottom: -60px;
}

.profile-avatar {
  width: 130px;
  height: 130px;
  border-radius: 8px;
  overflow: hidden;
  border: 4px solid white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  background: white;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 3rem;
  font-weight: bold;
}

/* 用户信息 */
.profile-info {
  flex: 1;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding-bottom: 10px;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 10px 0;
}

.profile-bio {
  font-size: 0.95rem;
  opacity: 0.9;
  margin: 0 0 8px 0;
  max-width: 500px;
  line-height: 1.5;
}

.profile-location {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 操作按钮 */
.profile-actions {
  display: flex;
  gap: 12px;
  padding-bottom: 10px;
}

.btn-edit {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.btn-light {
  background: white;
  color: #333;
  padding: 10px 20px;
  border-radius: 20px;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-light:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: white;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #42b883;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  flex: 1;
  min-width: 150px;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-arrow {
  margin-left: auto;
  font-size: 1.5rem;
  color: #ccc;
  font-weight: 300;
  transition: all 0.3s ease;
}

.stat-card.clickable:hover .stat-arrow {
  color: #667eea;
  transform: translateX(5px);
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.stat-title {
  color: #666;
  font-size: 0.875rem;
}

/* 主要内容 */
.main-content {
  padding-bottom: 4rem;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

/* 左侧导航 */
.sidebar {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #333;
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
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.menu-item:hover {
  background: #f5f7fa;
}

.menu-icon {
  font-size: 1.25rem;
  color: #666;
  width: 24px;
  text-align: center;
}

.menu-title {
  font-size: 0.9375rem;
  color: #333;
}

/* 右侧个人信息 */
.profile-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #333;
}

.profile-info-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9375rem;
}

.info-value {
  color: #333;
  font-size: 0.9375rem;
}

/* 登出按钮 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-left {
    gap: 1rem;
  }

  .nav-links {
    display: none;
  }

  .banner-content {
    flex-direction: column;
    text-align: center;
  }

  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }

  .profile-content {
    order: 1;
  }

  .info-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .info-label {
    font-size: 0.875rem;
    color: #999;
  }
}
</style>

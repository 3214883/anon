<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()
const userId = route.params.id as string

const user = ref<any>(null)
const userEvents = ref<any[]>([])
const loading = ref(true)
const error = ref('')

const loadUserInfo = async () => {
  try {
    const response = await api.get(`/users/${userId}`)
    if (response.success && response.data) {
      user.value = response.data
    }
  } catch (err) {
    console.error('加载用户信息失败:', err)
    error.value = '加载用户信息失败'
  }
}

const loadUserEvents = async () => {
  try {
    const response = await api.get(`/events/organizer/${userId}`)
    if (response.success && response.data) {
      userEvents.value = response.data
    }
  } catch (err) {
    console.error('加载用户活动失败:', err)
  }
}

const goToEventDetail = (eventId: number) => {
  router.push(`/event/${eventId}`)
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/events')
  }
}

const isEnded = (event: any) => {
  const eventDate = new Date(event.date)
  const [hours, minutes] = (event.endTime || '23:59').split(':').map(Number)
  eventDate.setHours(hours, minutes, 0, 0)
  return new Date() > eventDate
}

onMounted(async () => {
  await loadUserInfo()
  await loadUserEvents()
  loading.value = false
})

const stats = computed(() => {
  const events = userEvents.value
  const totalEvents = events.length
  const activeEvents = events.filter(e => !isEnded(e) && e.status === 'published').length
  const totalParticipants = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0)
  const avgRating = events.length > 0 ? '4.8' : '-'

  return [
    { icon: '📅', label: '累计活动', value: totalEvents, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { icon: '🔥', label: '进行中', value: activeEvents, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { icon: '👥', label: '参与人数', value: totalParticipants, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { icon: '⭐', label: '综合评分', value: avgRating, color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
  ]
})

const publishedEvents = computed(() => {
  return userEvents.value.filter(e => e.status === 'published')
})
</script>

<template>
  <div class="user-profile-page">
    <button class="back-button" @click="goBack">← 返回</button>

    <div v-if="loading" class="loading-page">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="error" class="empty-state">
      <span class="empty-icon">😵</span>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="user" class="profile-content">
      <div class="profile-main">
        <div class="profile-cover-card">
          <div class="profile-cover">
            <div class="cover-image">
              <img v-if="user.coverImage" :src="user.coverImage" :alt="user.username" />
              <div v-else class="cover-placeholder"></div>
            </div>
            <div class="cover-overlay"></div>
          </div>
        </div>

        <div class="profile-header">
          <div class="profile-avatar">
            <img v-if="user.avatar" :src="user.avatar" :alt="user.username" />
            <div v-else class="avatar-placeholder">{{ (user.username || 'U').charAt(0) }}</div>
            <div v-if="user.role === 'admin'" class="verified-badge">✓</div>
          </div>

          <div class="profile-info">
            <div class="profile-name-row">
              <h1 class="profile-name">{{ user.username }}</h1>
              <span v-if="user.role === 'admin'" class="admin-badge">官方认证</span>
            </div>

            <div class="profile-meta">
              <span v-if="user.location" class="meta-item">
                📍 {{ user.location }}
              </span>
              <span v-if="user.bio" class="meta-item">
                📝 {{ user.bio }}
              </span>
              <span v-if="user.phone" class="meta-item">
                📱 {{ user.phone }}
              </span>
            </div>

            <p v-if="user.bio" class="profile-bio">{{ user.bio }}</p>
          </div>
        </div>

        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-card" :style="{ background: stat.color }">
            <span class="stat-icon">{{ stat.icon }}</span>
            <div class="stat-content">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <div class="events-section">
          <div class="section-header">
            <h2 class="section-title">🎪 主办活动</h2>
            <span class="section-count">{{ publishedEvents.length }} 场</span>
          </div>

          <div v-if="publishedEvents.length === 0" class="empty-state">
            <span class="empty-icon">🎡</span>
            <p>还没有主办任何活动</p>
          </div>

          <div v-else class="events-grid">
            <div
              v-for="event in publishedEvents"
              :key="event.id"
              class="event-card"
              @click="goToEventDetail(event.id)"
            >
              <div class="event-image">
                <img v-if="event.coverImage" :src="event.coverImage" :alt="event.title" />
                <div v-else class="image-placeholder">
                  <span class="icon">🎉</span>
                </div>
                <div v-if="isEnded(event)" class="event-status-badge ended">
                  已结束
                </div>
                <div v-else class="event-status-badge active">
                  报名中
                </div>
              </div>

              <div class="event-content">
                <h3 class="event-title">{{ event.title }}</h3>

                <div class="event-info">
                  <div class="info-row">
                    <span class="info-icon">📅</span>
                    <span>{{ event.date?.split('T')[0] }} {{ event.startTime }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon">📍</span>
                    <span>{{ event.location }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon">👥</span>
                    <span>{{ event.registeredCount || 0 }} / {{ event.capacity }} 人</span>
                  </div>
                </div>

                <div class="event-bottom">
                  <div class="event-price" :class="{ free: event.price === 0 }">
                    <span v-if="event.price > 0">¥{{ event.price }}</span>
                    <span v-else>免费</span>
                  </div>
                  <div class="event-arrow">→</div>
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
.user-profile-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 60px;
}

.back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 100;
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
}

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  color: #999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e8e8e8;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
}

.profile-cover {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
}

.profile-main {
  max-width: 1100px;
  margin: 40px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 10;
}

.profile-cover-card {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  margin-bottom: -70px;
  position: relative;
}

.profile-header {
  display: flex;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 32px;
  position: relative;
  z-index: 20;
  padding: 0 24px;
}

.profile-avatar {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  flex-shrink: 0;
  background: #fff;
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
  color: #fff;
  font-size: 56px;
  font-weight: 600;
}

.verified-badge {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4);
}

.profile-info {
  flex: 1;
  padding: 20px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 8px;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-name {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
}

.admin-badge {
  padding: 4px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.3);
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.profile-bio {
  margin: 0;
  font-size: 15px;
  color: #444;
  line-height: 1.6;
  max-width: 600px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 40px;
}

.stat-card {
  padding: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  backdrop-filter: blur(10px);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
}

.events-section {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.section-count {
  padding: 4px 12px;
  border-radius: 12px;
  background: #f0f5ff;
  color: #667eea;
  font-size: 13px;
  font-weight: 600;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.event-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.event-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  border-color: #667eea;
}

.event-image {
  position: relative;
  height: 160px;
  overflow: hidden;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  gap: 8px;
}

.image-placeholder .icon {
  font-size: 40px;
}

.event-status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.event-status-badge.ended {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
}

.event-status-badge.active {
  background: #52c41a;
  color: #fff;
}

.event-content {
  padding: 16px;
}

.event-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.info-icon {
  font-size: 14px;
  opacity: 0.8;
}

.event-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.event-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff4d4f;
}

.event-price.free {
  color: #52c41a;
}

.event-arrow {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #999;
  transition: all 0.3s;
}

.event-card:hover .event-arrow {
  background: #667eea;
  color: #fff;
  transform: translateX(3px);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .events-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .profile-cover {
    height: 200px;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-name {
    font-size: 24px;
    color: #333;
    text-shadow: none;
  }

  .profile-meta {
    justify-content: center;
  }

  .meta-item {
    color: #666;
  }

  .profile-bio {
    color: #666;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
    flex-direction: column;
    text-align: center;
  }

  .stat-value {
    font-size: 22px;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  .events-section {
    padding: 20px;
  }
}
</style>

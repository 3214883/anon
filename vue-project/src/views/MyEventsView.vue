<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { eventService, registrationService } from '../api/services'
import { tokenManager } from '../utils/tokenManager'

const router = useRouter()
const route = useRoute()

const eventType = ref(route.query.type === 'created' ? 'created' : 'joined')
const showEnded = ref(false)
const events = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const user = ref<any>(null)

onMounted(() => {
  const userData = localStorage.getItem('user')
  const accessToken = tokenManager.getAccessToken()
  if (!userData || !accessToken) {
    router.push('/login')
    return
  }

  if (userData) {
    user.value = JSON.parse(userData)
  }

  loadEvents()
})

const loadEvents = async () => {
  loading.value = true
  error.value = ''
  try {
    if (eventType.value === 'created') {
      const response = await eventService.getEvents()
      if (response) {
        const eventsData = response.data || response
        const userData = localStorage.getItem('user')
        if (userData) {
          const currentUser = JSON.parse(userData)
          events.value = eventsData.filter((event: any) => event.organizerId === currentUser.id)
        }
      }
    } else {
      const response = await registrationService.getUserRegistrations()
      if (response) {
        const registrationsData = response.data || response
        events.value = registrationsData.map((registration: any) => registration.event)
      }
    }
  } catch (err: any) {
    error.value = err.message || '加载活动失败'
    console.error('Error loading events:', err)
    if (err.response && err.response.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const goToEventDetail = (eventId: number) => {
  router.push(`/event/${eventId}`)
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}

const displayedEvents = computed(() => {
  if (showEnded.value) {
    return events.value.filter(event => isEnded(event))
  }
  return events.value
})

const isEnded = (event: any) => {
  if (!event.date) return false

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const eventDateParts = event.date.split('-')
  const eventYear = parseInt(eventDateParts[0])
  const eventMonth = parseInt(eventDateParts[1]) - 1
  const eventDay = parseInt(eventDateParts[2])
  const eventDate = new Date(eventYear, eventMonth, eventDay)

  if (today > eventDate) {
    return true
  }

  if (today.getTime() === eventDate.getTime() && event.endTime) {
    const timeParts = event.endTime.split(':')
    const eventEndDateTime = new Date(eventYear, eventMonth, eventDay, parseInt(timeParts[0]), parseInt(timeParts[1]))
    return now > eventEndDateTime
  }

  return false
}

const stats = computed(() => {
  const totalEvents = events.value.length
  const activeEvents = events.value.filter(e => !isEnded(e) && e.status === 'published').length
  const totalParticipants = events.value.reduce((sum, e) => sum + (e.registeredCount || 0), 0)
  const endedEvents = events.value.filter(e => isEnded(e)).length

  if (eventType.value === 'created') {
    return [
      { icon: '📅', label: '创建活动', value: totalEvents, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { icon: '🔥', label: '报名中', value: activeEvents, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      { icon: '👥', label: '参与人数', value: totalParticipants, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      { icon: '✅', label: '已结束', value: endedEvents, color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
    ]
  } else {
    return [
      { icon: '🎯', label: '报名活动', value: totalEvents, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { icon: '🔥', label: '进行中', value: activeEvents, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      { icon: '⭐', label: '进行中', value: activeEvents, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      { icon: '📜', label: '已完成', value: endedEvents, color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
    ]
  }
})
</script>

<template>
  <div class="my-events-page">
    <button class="back-button" @click="goBack">← 返回</button>

    <div v-if="loading" class="loading-page">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="error" class="empty-state">
      <span class="empty-icon">😵</span>
      <p>{{ error }}</p>
    </div>

    <div v-else class="profile-content">
      <div class="profile-main">
        <div class="profile-cover-card">
          <div class="profile-cover">
            <div class="cover-image">
              <img v-if="user?.coverImage" :src="user.coverImage" :alt="user.username" />
              <div v-else class="cover-placeholder"></div>
            </div>
            <div class="cover-overlay"></div>
          </div>
        </div>

        <div class="profile-header">
          <div class="profile-avatar">
            <img v-if="user?.avatar" :src="user.avatar" :alt="user.username" />
            <div v-else class="avatar-placeholder">{{ (user?.username || 'U').charAt(0) }}</div>
          </div>

          <div class="profile-info">
            <div class="profile-name-row">
              <h1 class="profile-name">{{ user?.username || '用户' }}</h1>
              <span class="admin-badge">{{ eventType === 'created' ? '📅 我创建的' : '🎯 我参加的' }}</span>
            </div>
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
            <h2 class="section-title">{{ eventType === 'created' ? '🎪 我主办的活动' : '🎉 我报名的活动' }}</h2>
            <div class="filter-wrapper">
              <label class="filter-checkbox">
                <input type="checkbox" v-model="showEnded" />
                <span>只显示已结束</span>
              </label>
              <span class="section-count">{{ displayedEvents.length }} 场</span>
            </div>
          </div>

          <div v-if="displayedEvents.length === 0" class="empty-state">
            <span class="empty-icon">🎡</span>
            <p>{{ eventType === 'created' ? '还没有创建任何活动' : '还没有报名任何活动' }}</p>
          </div>

          <div v-else class="events-grid">
            <div
              v-for="event in displayedEvents"
              :key="event.id"
              class="event-card"
              @click="goToEventDetail(event.id)"
            >
              <div class="event-image">
                <img v-if="event.coverImage || event.image" :src="event.coverImage || event.image" :alt="event.title" />
                <div v-else class="image-placeholder">
                  <span class="icon">🎉</span>
                </div>
                <div v-if="isEnded(event)" class="event-status-badge ended">
                  已结束
                </div>
                <div v-else-if="event.status === 'pending' && eventType === 'created'" class="event-status-badge pending">
                  审核中
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
                    <span>{{ event.date?.split('T')[0] }} {{ event.startTime || event.time }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon">📍</span>
                    <span>{{ event.location }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-icon">👥</span>
                    <span>{{ event.registeredCount || 0 }} / {{ event.capacity || event.maxParticipants }} 人</span>
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
.my-events-page {
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
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
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
  width: 120px;
  height: 120px;
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
  font-size: 48px;
  font-weight: 600;
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
  margin-bottom: 8px;
}

.profile-name {
  margin: 0;
  font-size: 28px;
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
  justify-content: space-between;
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

.filter-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
}

.filter-checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
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
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.event-image {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.event-card:hover .event-image img {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-placeholder .icon {
  font-size: 48px;
}

.event-status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.event-status-badge.ended {
  background: #ff4d4f;
  color: #fff;
}

.event-status-badge.active {
  background: #52c41a;
  color: #fff;
}

.event-status-badge.pending {
  background: #faad14;
  color: #fff;
}

.event-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.event-price {
  font-size: 18px;
  font-weight: 700;
  color: #667eea;
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
  transform: translateX(2px);
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .events-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-name-row {
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 24px;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>

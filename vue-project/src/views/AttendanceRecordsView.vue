<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const attendanceRecords = ref<any[]>([])
const loading = ref(false)
const error = ref('')

interface AttendanceRecord {
  id: number
  eventId: number
  eventTitle: string
  eventDate: string
  checkinTime: string
  status: string
  location: string
}

onMounted(() => {
  loadAttendanceRecords()
})

const loadAttendanceRecords = async () => {
  loading.value = true
  error.value = ''
  try {
    // 模拟出席记录数据
    // 实际项目中，这里应该从API获取出席记录
    attendanceRecords.value = [
      {
        id: 1,
        eventId: 1,
        eventTitle: '周末户外徒步活动',
        eventDate: '2023-04-01',
        checkinTime: '2023-04-01T09:00:00Z',
        status: 'attended',
        location: '香山公园'
      },
      {
        id: 2,
        eventId: 2,
        eventTitle: '技术分享会',
        eventDate: '2023-03-15',
        checkinTime: '2023-03-15T14:00:00Z',
        status: 'attended',
        location: '中关村创新中心'
      }
    ]
  } catch (err: any) {
    error.value = err.message || '加载出席记录失败'
    console.error('Error loading attendance records:', err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}
</script>

<template>
  <div class="attendance-records-page">
    <!-- 顶部导航 -->
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">{{ t('attendanceRecords') }}</h1>
      <div class="header-actions"></div>
    </div>

    <div class="page-container">
      <!-- 出席记录列表 -->
      <div v-if="loading" class="loading">
        {{ t('loading') }}
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else-if="attendanceRecords.length === 0" class="no-records">
        {{ t('noAttendanceRecords') }}
      </div>
      <div v-else class="records-list">
        <div
          v-for="record in attendanceRecords"
          :key="record.id"
          class="record-card"
        >
          <div class="record-header">
            <h3 class="event-title">{{ record.eventTitle }}</h3>
            <span class="attendance-status" :class="record.status">
              {{ record.status === 'attended' ? t('attended') : t('absent') }}
            </span>
          </div>
          <div class="record-details">
            <div class="detail-row">
              <span class="detail-icon">📅</span>
              <span class="detail-text">{{ record.eventDate }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-icon">⏰</span>
              <span class="detail-text">{{ new Date(record.checkinTime).toLocaleTimeString() }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-icon">📍</span>
              <span class="detail-text">{{ record.location }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="router.push('/')">
        <div class="nav-icon">🏠</div>
        <div class="nav-label">{{ $t('home') }}</div>
      </div>
      <div class="nav-item" @click="router.push('/create-event')">
        <div class="nav-icon create-icon">+</div>
        <div class="nav-label">{{ $t('create') }}</div>
      </div>
      <div class="nav-item active" @click="router.push('/profile')">
        <div class="nav-icon">👤</div>
        <div class="nav-label">{{ $t('my') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attendance-records-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
  padding-bottom: 70px; /* 为底部导航栏留出空间 */
}

.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

/* 顶部导航 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 8px 8px 0 0;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.back-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* 加载和错误状态 */
.loading,
.error,
.no-records {
  text-align: center;
  padding: 4rem 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.125rem;
}

.error {
  color: #e74c3c;
}

/* 出席记录列表 */
.records-list {
  margin-top: 1rem;
}

.record-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.record-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.event-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.attendance-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.attendance-status.attended {
  background: rgba(66, 184, 131, 0.2);
  border: 1px solid rgba(66, 184, 131, 0.4);
  color: #42b883;
}

.attendance-status.absent {
  background: rgba(231, 76, 60, 0.2);
  border: 1px solid rgba(231, 76, 60, 0.4);
  color: #e74c3c;
}

.record-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-icon {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.5);
  width: 20px;
  text-align: center;
}

.detail-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

/* 底部导航栏 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 0;
  z-index: 1000;
  border-radius: 0 0 8px 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 8px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: #42b883;
}

.nav-icon {
  font-size: 1.25rem;
}

.create-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  transform: translateY(-10px);
  box-shadow: 0 4px 15px rgba(66, 184, 131, 0.4);
}

.nav-label {
  font-size: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .attendance-records-page {
    padding-bottom: 60px;
  }

  .header {
    padding: 0.75rem;
  }

  .record-card {
    padding: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .event-title {
    font-size: 1rem;
  }

  .detail-row {
    gap: 0.5rem;
  }

  .detail-text {
    font-size: 0.8125rem;
  }

  .bottom-nav {
    padding: 0.5rem 0;
  }

  .nav-icon {
    font-size: 1.125rem;
  }

  .create-icon {
    width: 36px;
    height: 36px;
    font-size: 1.25rem;
  }
}
</style>

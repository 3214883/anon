<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const likes = ref<any[]>([])

const userData = JSON.parse(localStorage.getItem('user') || '{}')

interface LikedEvent {
  id: number
  title: string
  coverImage: string
  date: string
  location: string
  category: string
  likeCount: number
  likedAt: string
}

const mockLikes = ref<LikedEvent[]>([
  {
    id: 1,
    title: '2024人工智能技术峰会',
    coverImage: 'https://picsum.photos/400/300?random=1',
    date: '2026-05-15',
    location: '北京国际会议中心',
    category: '科技',
    likeCount: 328,
    likedAt: '2026-04-20'
  },
  {
    id: 2,
    title: '创业者交流分享会',
    coverImage: 'https://picsum.photos/400/300?random=2',
    date: '2026-05-20',
    location: '上海创客空间',
    category: '商业',
    likeCount: 156,
    likedAt: '2026-04-18'
  },
  {
    id: 3,
    title: 'UI/UX设计工作坊',
    coverImage: 'https://picsum.photos/400/300?random=3',
    date: '2026-05-25',
    location: '深圳设计中心',
    category: '设计',
    likeCount: 89,
    likedAt: '2026-04-15'
  }
])

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.get('/user-center/likes')
    if (response.success && response.data) {
      likes.value = response.data
    }
  } catch (err) {
    console.error('Error loading likes:', err)
  } finally {
    loading.value = false
  }
})

const goToEvent = (eventId: number) => {
  router.push(`/event/${eventId}`)
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
  <div class="likes-page">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">
        <span class="title-icon">👍</span>
        我的点赞
      </h1>
      <div class="header-actions">
        <span class="count-badge">{{ likes.length }} 个活动</span>
      </div>
    </div>

    <div class="page-content">
      <div v-if="likes.length === 0" class="empty-state">
        <div class="empty-icon">👍</div>
        <p class="empty-text">还没有点赞任何活动</p>
        <p class="empty-desc">去发现有趣的活动，为它们点赞吧！</p>
        <button class="explore-button" @click="router.push('/event')">
          浏览活动
        </button>
      </div>

      <div v-else class="likes-list">
        <div
          v-for="item in likes"
          :key="item.id"
          class="like-card"
          @click="goToEvent(item.id)"
        >
          <div class="event-cover">
            <img :src="item.coverImage" :alt="item.title" />
            <div class="category-badge">{{ item.category }}</div>
          </div>

          <div class="event-info">
            <h3 class="event-title">{{ item.title }}</h3>
            <div class="event-meta">
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span>{{ item.date }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">📍</span>
                <span>{{ item.location }}</span>
              </div>
            </div>
            <div class="event-stats">
              <span class="stat-item">
                <span class="stat-icon">👍</span>
                {{ item.likeCount }} 人点赞
              </span>
              <span class="like-date">
                点赞于 {{ item.likedAt }}
              </span>
            </div>
          </div>

          <div class="card-arrow">›</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.likes-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.back-button {
  background: #f5f7fa;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.back-button:hover {
  background: #e4e8ec;
  transform: translateX(-3px);
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  background: linear-gradient(135deg, #ec407a 0%, #f48fb1 100%);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.header-actions {
  margin-left: auto;
}

.count-badge {
  background: linear-gradient(135deg, #ec407a 0%, #f48fb1 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.page-content {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.empty-desc {
  color: #999;
  margin-bottom: 2rem;
}

.explore-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.explore-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.likes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.like-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
  gap: 1.5rem;
}

.like-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.event-cover {
  position: relative;
  width: 160px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
}

.event-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.event-info {
  flex: 1;
}

.event-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
}

.event-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.event-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #ec407a;
  font-weight: 600;
}

.like-date {
  font-size: 0.8rem;
  color: #999;
}

.card-arrow {
  font-size: 2rem;
  color: #ccc;
  font-weight: 300;
  transition: all 0.3s;
}

.like-card:hover .card-arrow {
  color: #667eea;
  transform: translateX(5px);
}
</style>

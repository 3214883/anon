<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)

interface RatedEvent {
  id: number
  eventId: number
  title: string
  coverImage: string
  rating: number
  content: string
  ratedAt: string
  eventDate: string
}

const mockRatings = ref<RatedEvent[]>([
  {
    id: 1,
    eventId: 101,
    title: '前端技术分享大会',
    coverImage: 'https://picsum.photos/400/300?random=20',
    rating: 5,
    content: '非常棒的活动！讲师很专业，内容很实用，学到了很多新技术。现场互动也很活跃，认识了很多同行朋友。',
    ratedAt: '2026-04-20',
    eventDate: '2026-04-15'
  },
  {
    id: 2,
    eventId: 102,
    title: '产品经理思维训练营',
    coverImage: 'https://picsum.photos/400/300?random=21',
    rating: 4,
    content: '整体不错！案例分析很深入，就是时间稍微有点紧凑。建议下次可以增加小组讨论的时间。',
    ratedAt: '2026-04-18',
    eventDate: '2026-04-10'
  },
  {
    id: 3,
    eventId: 103,
    title: '周末户外徒步活动',
    coverImage: 'https://picsum.photos/400/300?random=22',
    rating: 5,
    content: '领队很负责！路线规划得很好，风景超美。认识了一群志同道合的朋友，下次还会参加！',
    ratedAt: '2026-04-10',
    eventDate: '2026-04-05'
  }
])

const ratings = ref<RatedEvent[]>([])

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.get('/user-center/ratings')
    if (response.success && response.data) {
      ratings.value = response.data
    }
  } catch (err) {
    console.error('Error loading ratings:', err)
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

const renderStars = (rating: number) => {
  return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
}

const getAverageRating = () => {
  if (ratings.value.length === 0) return 0
  const sum = ratings.value.reduce((acc, r) => acc + r.rating, 0)
  return (sum / ratings.value.length).toFixed(1)
}
</script>

<template>
  <div class="ratings-page">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">
        <span class="title-icon">📝</span>
        我的评分
      </h1>
      <div class="header-actions">
        <div class="stats-badge">
          <span class="average-score">{{ getAverageRating() }}</span>
          <span class="average-stars">{{ renderStars(Math.round(Number(getAverageRating()))) }}</span>
          <span class="separator">|</span>
          <span class="count-text">{{ ratings.length }} 条评价</span>
        </div>
      </div>
    </div>

    <div class="page-content">
      <div v-if="ratings.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">还没有发表过评分</p>
        <p class="empty-desc">参加活动后记得来分享你的体验哦！</p>
        <button class="explore-button" @click="router.push('/events')">
          浏览活动
        </button>
      </div>

      <div v-else class="ratings-list">
        <div
          v-for="item in ratings"
          :key="item.id"
          class="rating-card"
        >
          <div class="event-header" @click="goToEvent(item.eventId)">
            <img :src="item.coverImage" :alt="item.title" class="event-thumb" />
            <div class="event-brief">
              <h3 class="event-title">{{ item.title }}</h3>
              <p class="event-date">活动时间: {{ item.eventDate }}</p>
            </div>
            <div class="card-arrow">›</div>
          </div>

          <div class="rating-content">
            <div class="rating-header">
              <div class="stars-display">
                {{ renderStars(item.rating) }}
              </div>
              <span class="rating-score">{{ item.rating }}.0 分</span>
              <span class="rating-date">评价于 {{ item.ratedAt }}</span>
            </div>
            <p class="rating-text">{{ item.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ratings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.back-button {
  background: #e3f2fd;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.back-button:hover {
  background: #bbdefb;
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
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
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

.stats-badge {
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.average-score {
  font-size: 1.25rem;
  font-weight: 700;
}

.average-stars {
  font-size: 0.8rem;
}

.separator {
  opacity: 0.6;
}

.page-content {
  max-width: 900px;
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
  background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
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
  box-shadow: 0 8px 25px rgba(25, 118, 210, 0.4);
}

.ratings-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rating-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.event-header {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  background: #f5f9fd;
  border-bottom: 1px solid #e3f2fd;
  cursor: pointer;
  transition: background 0.3s;
  gap: 1rem;
}

.event-header:hover {
  background: #e3f2fd;
}

.event-thumb {
  width: 70px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.event-brief {
  flex: 1;
}

.event-title {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.event-date {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
}

.card-arrow {
  font-size: 1.5rem;
  color: #ccc;
  font-weight: 300;
  transition: all 0.3s;
}

.event-header:hover .card-arrow {
  color: #1976d2;
  transform: translateX(5px);
}

.rating-content {
  padding: 1.25rem;
}

.rating-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.stars-display {
  font-size: 1.25rem;
}

.rating-score {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1976d2;
}

.rating-date {
  font-size: 0.8rem;
  color: #999;
  margin-left: auto;
}

.rating-text {
  margin: 0;
  color: #555;
  line-height: 1.7;
  font-size: 0.95rem;
}
</style>

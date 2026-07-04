<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const favorites = ref<any[]>([])

interface FavoriteEvent {
  id: number
  title: string
  coverImage: string
  date: string
  location: string
  category: string
  price: number
  favoriteCount: number
  favoritedAt: string
}

const mockFavorites = ref<FavoriteEvent[]>([
  {
    id: 1,
    title: '全球区块链技术大会',
    coverImage: 'https://picsum.photos/400/300?random=10',
    date: '2026-06-01',
    location: '杭州国际博览中心',
    category: '科技',
    price: 299,
    favoriteCount: 512,
    favoritedAt: '2026-04-22'
  },
  {
    id: 2,
    title: '春季音乐节',
    coverImage: 'https://picsum.photos/400/300?random=11',
    date: '2026-05-28',
    location: '成都露天音乐公园',
    category: '音乐',
    price: 199,
    favoriteCount: 896,
    favoritedAt: '2026-04-20'
  },
  {
    id: 3,
    title: 'Python编程进阶训练营',
    coverImage: 'https://picsum.photos/400/300?random=12',
    date: '2026-06-10',
    location: '线上直播',
    category: '教育',
    price: 99,
    favoriteCount: 234,
    favoritedAt: '2026-04-19'
  },
  {
    id: 4,
    title: '美食文化节',
    coverImage: 'https://picsum.photos/400/300?random=13',
    date: '2026-05-30',
    location: '广州国际美食中心',
    category: '美食',
    price: 0,
    favoriteCount: 1205,
    favoritedAt: '2026-04-18'
  }
])

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.get('/user-center/favorites')
    if (response.success && response.data) {
      favorites.value = response.data
    }
  } catch (err) {
    console.error('Error loading favorites:', err)
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

const formatPrice = (price: number) => {
  return price === 0 ? '免费' : `¥${price}`
}
</script>

<template>
  <div class="favorites-page">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">
        <span class="title-icon">💛</span>
        我的收藏
      </h1>
      <div class="header-actions">
        <span class="count-badge">{{ favorites.length }} 个活动</span>
      </div>
    </div>

    <div class="page-content">
      <div v-if="favorites.length === 0" class="empty-state">
        <div class="empty-icon">⭐</div>
        <p class="empty-text">还没有收藏任何活动</p>
        <p class="empty-desc">收藏感兴趣的活动，随时查看报名吧！</p>
        <button class="explore-button" @click="router.push('/events')">
          浏览活动
        </button>
      </div>

      <div v-else class="favorites-grid">
        <div
          v-for="item in favorites"
          :key="item.id"
          class="favorite-card"
          @click="goToEvent(item.id)"
        >
          <div class="card-cover">
            <img :src="item.coverImage" :alt="item.title" />
            <div class="favorite-badge">
              <span class="favorite-icon">⭐</span>
            </div>
            <div class="price-tag" :class="{ free: item.price === 0 }">
              {{ formatPrice(item.price) }}
            </div>
          </div>

          <div class="card-content">
            <div class="category-label">{{ item.category }}</div>
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
            <div class="card-footer">
              <span class="stat-item">
                <span class="stat-icon">⭐</span>
                {{ item.favoriteCount }} 人收藏
              </span>
              <span class="favorite-date">
                {{ item.favoritedAt }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.back-button {
  background: #fff8e1;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.back-button:hover {
  background: #ffecb3;
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
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
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
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.page-content {
  max-width: 1200px;
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
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
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
  box-shadow: 0 8px 25px rgba(255, 152, 0, 0.4);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.favorite-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s;
}

.favorite-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-cover {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.favorite-card:hover .card-cover img {
  transform: scale(1.05);
}

.favorite-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 152, 0, 0.9);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.favorite-icon {
  font-size: 1rem;
}

.price-tag {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: linear-gradient(135deg, #ff9800 0%, #ffb74d 100%);
  color: white;
  padding: 0.4rem 0.875rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
}

.price-tag.free {
  background: linear-gradient(135deg, #4caf50 0%, #81c784 100%);
}

.card-content {
  padding: 1.25rem;
}

.category-label {
  display: inline-block;
  background: #fff3e0;
  color: #e65100;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.event-title {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
  line-height: 1.4;
}

.event-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #666;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #ff9800;
  font-weight: 600;
}

.favorite-date {
  font-size: 0.75rem;
  color: #999;
}
</style>

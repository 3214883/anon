<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { eventService } from '../api/services'

const { t } = useI18n()
const router = useRouter()

interface Event {
  id: number
  title: string
  description: string
  date: string
  time: string
  location: string
  category: string
  participants: number
  capacity: number
  fee: number
  image?: string
  status: string
}

const isHovered = ref(false)
const recentEvents = ref<Event[]>([])
const upcomingEvents = ref<Event[]>([])
const currentBanner = ref(0)

const banners = ref([
  {
    id: 1,
    title: '🔥 春季户外活动季',
    subtitle: '精选户外探险活动，限时优惠报名中！',
    image: 'https://picsum.photos/1200/400?random=1',
    link: '/events?category=outdoor',
    isActive: true
  },
  {
    id: 2,
    title: '💼 创业沙龙专场',
    subtitle: '与行业大咖面对面，拓展人脉资源',
    image: 'https://picsum.photos/1200/400?random=2',
    link: '/events?category=tech',
    isActive: true
  },
  {
    id: 3,
    title: '🎊 新用户专享福利',
    subtitle: '首次报名立减 20 元，快来参加吧！',
    image: 'https://picsum.photos/1200/400?random=3',
    link: '/events',
    isActive: true
  }
])

const sponsoredEvents = ref<any[]>([])

const activeBanners = computed(() => banners.value.filter(b => b.isActive))

const goToCreateEvent = () => {
  router.push('/create-event')
}

const goToEvents = () => {
  router.push('/events')
}

const goToEventDetail = (eventId: number) => {
  router.push(`/event/${eventId}`)
}

const goToBanner = (link: string) => {
  router.push(link)
}

const prevBanner = () => {
  const activeBanners = banners.value.filter(b => b.isActive)
  currentBanner.value = (currentBanner.value - 1 + activeBanners.length) % activeBanners.length
}

const nextBanner = () => {
  const activeBanners = banners.value.filter(b => b.isActive)
  currentBanner.value = (currentBanner.value + 1) % activeBanners.length
}

const goToSlide = (index: number) => {
  currentBanner.value = index
}

let bannerTimer: any = null

const startAutoPlay = () => {
  bannerTimer = setInterval(() => {
    nextBanner()
  }, 5000)
}

const stopAutoPlay = () => {
  if (bannerTimer) {
    clearInterval(bannerTimer)
    bannerTimer = null
  }
}

onMounted(() => {
  loadRecentEvents()
  loadUpcomingEvents()
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})

const loadUpcomingEvents = async () => {
  try {
    const response = await eventService.getUpcomingEvents()
    if (response.data) {
      upcomingEvents.value = response.data.map((e: any) => ({
        ...e,
        image: e.coverImage || e.image,
        participants: e.registeredCount || e.participants || 0,
        fee: e.price
      }))
    }
  } catch (error) {
    console.error('Error loading upcoming events:', error)
  }
}

const loadRecentEvents = async () => {
  try {
    const response = await eventService.getEvents()
    if (response.data) {
      // 按创建时间排序，取最近的6个活动
      recentEvents.value = response.data
        .sort((a: any, b: any) => (b.id || 0) - (a.id || 0))
        .map((e: any) => ({
          ...e,
          image: e.coverImage || e.image,
          participants: e.registeredCount || e.participants || 0,
          fee: e.price
        }))
        .slice(0, 6)

      // 加载首页推荐的活动
      sponsoredEvents.value = response.data
        .filter((e: any) => e.isSponsored && !isEnded(e))
        .map((e: any) => ({
          ...e,
          image: e.coverImage || e.image,
          participants: e.registeredCount || e.participants || 0,
          fee: e.price
        }))
        .slice(0, 4)
    }
  } catch (error) {
    console.error('Error loading recent events:', error)
  }
}

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
</script>

<template>
  <div class="home">
    <section class="hero">
      <div class="hero-content">
        <div class="logo-container" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
          <div class="logo" :class="{ hovered: isHovered }">🎉</div>
        </div>
        <h1 class="title">{{ $t('appName') }}</h1>
        <p class="subtitle">{{ $t('appDescription') }}</p>
        <div class="cta-buttons">
          <button class="btn btn-primary" @click="goToCreateEvent">{{ $t('createEvent') }}</button>
          <button class="btn btn-secondary" @click="goToEvents">{{ $t('browseEvents') }}</button>
        </div>
      </div>
      <div class="hero-decoration">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </section>

    <section class="banner-section">
      <div class="banner-carousel" @mouseenter="stopAutoPlay" @mouseleave="startAutoPlay">
        <div class="banner-container">
          <div
            v-for="(banner, index) in activeBanners"
            :key="banner.id"
            class="banner-slide"
            :class="{ active: index === currentBanner }"
            @click="goToBanner(banner.link)"
          >
            <img :src="banner.image" :alt="banner.title" class="banner-image" />
            <div class="banner-overlay">
              <div class="banner-content">
                <span class="sponsored-badge">🔥 推广</span>
                <h2 class="banner-title">{{ banner.title }}</h2>
                <p class="banner-subtitle">{{ banner.subtitle }}</p>
              </div>
            </div>
          </div>
        </div>

        <button class="carousel-btn prev" @click="prevBanner">‹</button>
        <button class="carousel-btn next" @click="nextBanner">›</button>

        <div class="carousel-dots">
          <span
            v-for="(_, index) in activeBanners"
            :key="index"
            class="dot"
            :class="{ active: index === currentBanner }"
            @click="goToSlide(index)"
          ></span>
        </div>
      </div>
    </section>

    <section class="sponsored-events" v-if="sponsoredEvents.length > 0">
      <h2 class="section-title">⭐ 精选推荐</h2>
      <div class="events-grid">
        <div
          v-for="event in sponsoredEvents"
          :key="event.id"
          class="event-card sponsored"
          @click="goToEventDetail(event.id)"
        >
          <div class="sponsored-tag">推广</div>
          <div class="event-image" v-if="event.image">
            <img :src="event.image" :alt="event.title" />
          </div>
          <div class="event-image placeholder" v-else>
            <div class="placeholder-content">
              <span class="icon">📷</span>
            </div>
          </div>
          <div class="event-info">
            <div class="event-category">{{ $t(`eventTypes.${event.category}`) }}</div>
            <h3 class="event-title">{{ event.title }}</h3>
            <p class="event-date">{{ event.date }} {{ event.time }}</p>
            <div class="event-details">
              <span class="detail-item">
                <i class="icon">📍</i>
                {{ event.location }}
              </span>
              <span class="detail-item">
                <i class="icon">👥</i>
                {{ event.participants }} / {{ event.capacity }}
              </span>
              <span class="detail-item" :class="{ free: event.fee === 0 }">
                <i class="icon">¥</i>
                <span v-if="event.fee > 0">{{ event.fee }}</span>
                <span v-else>免费</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="upcoming-events" v-if="upcomingEvents.length > 0">
      <h2 class="section-title">⏰ 近期活动（3日内）</h2>
      <div class="events-horizontal">
        <div
          v-for="event in upcomingEvents"
          :key="event.id"
          class="event-card-horizontal"
          @click="goToEventDetail(event.id)"
        >
          <div class="event-cover">
            <img :src="event.image" :alt="event.title" v-if="event.image" />
            <div class="event-date-badge">
              <div class="day">{{ event.date.split('-')[2] }}</div>
              <div class="month">{{ event.date.split('-')[1] }}月</div>
            </div>
          </div>
          <div class="event-content">
            <h3 class="event-title">{{ event.title }}</h3>
            <p class="event-time">
              <i class="icon">🕐</i>
              {{ event.startTime }} - {{ event.endTime }}
            </p>
            <p class="event-location">
              <i class="icon">📍</i>
              {{ event.location }}
            </p>
            <div class="event-footer">
              <span class="event-category">{{ $t(`eventTypes.${event.category}`) }}</span>
              <span class="event-spots">
                👥 {{ event.participants }} / {{ event.capacity }} 人
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="recent-events">
      <h2 class="section-title">{{ $t('recentEvents') }}</h2>
      <div class="events-grid" v-if="recentEvents.length > 0">
        <div
          v-for="event in recentEvents"
          :key="event.id"
          class="event-card"
          @click="goToEventDetail(event.id)"
        >
          <div class="event-image" v-if="event.image">
            <img :src="event.image" :alt="event.title" />
          </div>
          <div class="event-image placeholder" v-else>
            <div class="placeholder-content">
              <span class="icon">📷</span>
            </div>
          </div>
          <div class="event-info">
            <div class="event-category">{{ $t(`eventTypes.${event.category}`) }}</div>
            <h3 class="event-title">{{ event.title }}</h3>
            <p class="event-date">{{ event.date }} {{ event.time }}</p>
            <div class="event-details">
              <span class="detail-item">
                <i class="icon">📍</i>
                {{ event.location }}
              </span>
              <span class="detail-item">
                <i class="icon">👥</i>
                {{ event.participants }} / {{ event.capacity }}
              </span>
              <span class="detail-item" :class="{ free: event.fee === 0 }">
                <i class="icon">¥</i>
                <span v-if="event.fee > 0">{{ event.fee }}</span>
                <span v-else>免费</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="no-events" v-else>
        {{ $t('noEvents') }}
      </div>
    </section>


  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
}

.hero {
  position: relative;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 800px;
}

.logo-container {
  margin-bottom: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  background: #42b883;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
  transition: all 0.3s ease;
}

.logo.hovered {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(66, 184, 131, 0.4);
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.highlight {
  color: #42b883;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #42b883;
  color: white;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.btn-primary:hover {
  background: #38a169;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.section-title {
  text-align: center;
  font-size: 2rem;
  color: #333;
  margin-bottom: 2rem;
  padding-top: 2rem;
}

.recent-events {
  padding: 3rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.event-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.event-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.event-image {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.event-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.event-card:hover .event-image img {
  transform: scale(1.05);
}

.event-image.placeholder {
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
}

.placeholder-content .icon {
  font-size: 3rem;
  color: #ccc;
}

.event-info {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-category {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: #e8f5e8;
  border: 1px solid #c8e6c9;
  border-radius: 4px;
  color: #2e7d32;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.event-title {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.5rem;
  line-height: 1.4;
  font-weight: 600;
}

.event-date {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.8rem;
}

.detail-item.free {
  color: #52c41a;
  font-weight: 600;
}

.detail-item .icon {
  font-size: 0.9rem;
  color: #999;
}

.no-events {
  text-align: center;
  color: #666;
  padding: 3rem 0;
  font-size: 1.125rem;
}

.banner-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.banner-carousel {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.banner-container {
  position: relative;
  height: 300px;
}

.banner-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
  cursor: pointer;
}

.banner-slide.active {
  opacity: 1;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 100%);
  display: flex;
  align-items: center;
  padding: 3rem;
}

.banner-content {
  color: white;
}

.sponsored-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.banner-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.banner-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.carousel-btn:hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
}

.carousel-btn.prev {
  left: 1rem;
}

.carousel-btn.next {
  right: 1rem;
}

.carousel-dots {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: white;
  transform: scale(1.2);
}

.sponsored-events {
  padding: 2rem 2rem 0;
  max-width: 1200px;
  margin: 0 auto;
}

.event-card.sponsored {
  border: 2px solid #ffa502;
  position: relative;
  background: linear-gradient(135deg, #fffbf0 0%, white 100%);
}

.sponsored-tag {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.3rem 0.75rem;
  background: linear-gradient(135deg, #ffa502 0%, #ff6b6b 100%);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 12px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(255, 165, 2, 0.3);
}

.upcoming-events {
  padding: 2rem 2rem 0;
  max-width: 1200px;
  margin: 0 auto;
}

.events-horizontal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card-horizontal {
  display: flex;
  gap: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.event-card-horizontal:hover {
  transform: translateX(5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.12);
}

.event-cover {
  position: relative;
  min-width: 200px;
  width: 200px;
  height: 160px;
  overflow: hidden;
}

.event-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.event-card-horizontal:hover .event-cover img {
  transform: scale(1.05);
}

.event-date-badge {
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 55px;
  height: 55px;
  background: linear-gradient(135deg, #42b883 0%, #38a169 100%);
  color: white;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
}

.event-date-badge .day {
  font-size: 1.5rem;
  line-height: 1;
}

.event-date-badge .month {
  font-size: 0.8rem;
  margin-top: 0.25rem;
  opacity: 0.9;
}

.event-content {
  flex: 1;
  padding: 1.5rem 1.5rem 1.5rem 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.event-card-horizontal .event-title {
  font-size: 1.15rem;
  color: #333;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

.event-card-horizontal .event-time,
.event-card-horizontal .event-location {
  font-size: 0.9rem;
  color: #666;
  margin: 0.3rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.event-card-horizontal .event-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
}

.event-card-horizontal .event-category {
  padding: 0.25rem 0.75rem;
  background: #f0f9f4;
  color: #38a169;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.event-card-horizontal .event-spots {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

@media (max-width: 768px) {
  .event-card-horizontal {
    flex-direction: column;
    text-align: center;
  }

  .event-cover {
    width: 100%;
    min-width: 100%;
    height: 180px;
  }

  .event-content {
    padding: 1rem 1.5rem 1.5rem;
  }

  .event-card-horizontal .event-footer {
    flex-direction: column;
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .cta-buttons {
    flex-direction: column;
  }

  .stats {
    flex-direction: column;
    gap: 2rem;
  }

  .banner-container {
    height: 200px;
  }

  .banner-overlay {
    padding: 1.5rem;
  }

  .banner-title {
    font-size: 1.5rem;
  }

  .banner-subtitle {
    font-size: 0.9rem;
  }

  .carousel-btn {
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
  }
}
</style>

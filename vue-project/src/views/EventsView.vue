<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { eventService, registrationService, socialService } from '../api/services'
import api from '../api'
import { tokenManager } from '../utils/tokenManager'

const { t } = useI18n()
const router = useRouter()

interface Event {
  id: number
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  address: string
  category: string
  tags: string
  registeredCount: number
  capacity: number
  price: number
  coverImage: string
  viewCount: number
  likeCount: number
  favoriteCount: number
  commentCount: number
  status: string
  organizerId: number
  createdAt: string
  updatedAt: string
}

const events = ref<Event[]>([])
const selectedCategory = ref('all')
const searchKeyword = ref('')
const loading = ref(false)
const error = ref('')
const errorDetails = ref('')
const userJoinedEvents = ref<Set<number>>(new Set())
const registrations = ref<any[]>([])
const categories = ref<any[]>([
  { value: 'all', label: '全部' },
  { value: 'ended', label: '已结束' }
])
// 分页状态
const currentPage = ref(1)
const totalPages = ref(1)
const totalEvents = ref(0)

onMounted(() => {
  console.log('=== 组件挂载，开始加载活动 ===')
  loadCategories()
  loadEvents()
  loadUserJoinedEvents()
})

const loadCategories = async () => {
  try {
    const response = await api.get('/events/categories')
    if (response && response.success && response.data) {
      // 将数据库分类添加到分类列表
      const dbCategories = response.data.map((cat: any) => ({
        value: cat.id.toString(), // 使用categoryId作为value
        label: cat.name
      }))
      categories.value = [
        { value: 'all', label: '全部' },
        { value: 'ended', label: '已结束' },
        ...dbCategories
      ]
      console.log('加载分类成功:', categories.value)
    }
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

const loadUserJoinedEvents = async () => {
  const userData = localStorage.getItem('user')
  const accessToken = tokenManager.getAccessToken()
  if (userData && accessToken) {
    try {
      const response = await api.get('/registrations/me')
      if (response && response.success && response.data) {
        registrations.value = response.data
        const joinedEventIds = response.data
          .filter((reg: any) => !reg.isWaitlist)
          .map((reg: any) => reg.eventId)
        userJoinedEvents.value = new Set(joinedEventIds)
      }
    } catch (err) {
      console.error('Error loading joined events:', err)
    }
  }
}

const loadEvents = async (page: number = 1) => {
  loading.value = true
  error.value = ''
  errorDetails.value = ''
  try {
    console.log('=== 开始加载活动 ===')

    let response

    // 如果有搜索关键词，使用搜索API
    if (searchKeyword.value && searchKeyword.value.trim()) {
      console.log('Search keyword:', searchKeyword.value)
      response = await api.get('/events/search', {
        params: { keyword: searchKeyword.value.trim() }
      })
      // 搜索结果不分页
      totalPages.value = 1
      totalEvents.value = (response.data || []).length
      currentPage.value = 1
    } else {
      // 否则使用普通列表API
      const params: any = { page, limit: 8 }
      if (selectedCategory.value !== 'all') {
        params.category = selectedCategory.value
      }
      console.log('Params:', params)
      response = await api.get('/events', { params })

      // 更新分页信息
      if (response.pagination) {
        totalPages.value = response.pagination.totalPages || 1
        totalEvents.value = response.pagination.total || 0
        currentPage.value = page
      }
    }

    console.log('API response:', response)

    if (response && response.success && response.data) {
      events.value = response.data || []
      console.log('Events from API:', response.data)
      console.log('Events length:', (response.data || []).length)
    } else {
      events.value = []
      totalPages.value = 1
      totalEvents.value = 0
      console.log('No events data in response')
    }
  } catch (err: any) {
    error.value = '加载活动失败，请重试'
    errorDetails.value = err.message || JSON.stringify(err)
    console.error('=== 加载活动错误 ===');
    console.error('Error loading events:', err);
    console.error('Error message:', err.message);
  } finally {
    loading.value = false
    console.log('=== 加载活动完成 ===');
  }
}

const filteredEvents = computed(() => {
  if (selectedCategory.value === 'ended') {
    // 对于"已结束"，在前端筛选
    return events.value.filter(event => isEnded(event))
  }
  // 其他情况（全部或分类），直接返回从后端获取的结果
  return events.value
})

const handleCategoryChange = () => {
  currentPage.value = 1
  loadEvents(1)
}

const handleSearch = () => {
  currentPage.value = 1
  loadEvents(1)
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    loadEvents(page)
  }
}

const goToPrevPage = () => {
  if (currentPage.value > 1) {
    loadEvents(currentPage.value - 1)
  }
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    loadEvents(currentPage.value + 1)
  }
}

const showRegistrationForm = ref(false)
const currentEventId = ref(0)
const registrationForm = ref({
  contactName: '',
  contactPhone: ''
})

const isAdmin = () => {
  const userData = localStorage.getItem('user')
  if (!userData) return false
  const user = JSON.parse(userData)
  return user.role === 'admin'
}

const openRegistrationForm = (eventId: number) => {
  console.log('Opening registration form for event:', eventId)
  const accessToken = tokenManager.getAccessToken()
  console.log('Token available:', !!accessToken)
  if (!accessToken) {
    alert(t('pleaseLogin'))
    router.push('/login')
    return
  }
  if (isAdmin()) {
    window.alert('管理员账号无法报名活动，请使用普通用户账号')
    return
  }
  const event = events.value.find(e => e.id === eventId)
  if (event && isEnded(event)) {
    window.alert('该活动已结束，无法报名')
    return
  }
  currentEventId.value = eventId
  console.log('Set currentEventId:', currentEventId.value)
  registrationForm.value = {
    contactName: '',
    contactPhone: ''
  }
  console.log('Reset registration form:', registrationForm.value)
  showRegistrationForm.value = true
  console.log('Registration form opened, showRegistrationForm:', showRegistrationForm.value)
}

const submitRegistration = async () => {
  console.log('submitRegistration called!')
  try {
    console.log('Current event ID:', currentEventId.value)
    console.log('Registration form:', registrationForm.value)

    // 检查表单数据是否完整
    if (!registrationForm.value.contactName || !registrationForm.value.contactPhone) {
      console.error('Form data incomplete:', registrationForm.value)
      alert('请填写完整的报名信息')
      return
    }

    const event = events.value.find(e => e.id === currentEventId.value)
    console.log('Event:', event)

    if (!event) {
      alert('活动不存在')
      return
    }

    const accessToken = tokenManager.getAccessToken()
    console.log('Token available:', !!accessToken)

    if (!accessToken) {
      alert('请先登录')
      return
    }

    // 检查用户是否已经登录
    const userData = localStorage.getItem('user')
    console.log('User data:', userData)

    if (!userData) {
      alert('请先登录')
      return
    }

    // 检查用户ID是否有效
    const user = JSON.parse(userData)
    console.log('User:', user)

    if (!user || !user.id || user.id === 0) {
      alert('用户信息无效，请重新登录')
      return
    }

    const registrationData = {
      eventId: currentEventId.value,
      contactName: registrationForm.value.contactName,
      contactPhone: registrationForm.value.contactPhone,
      quantity: 1,
      totalAmount: event.price || 0
    }

    console.log('Sending registration data:', registrationData)

    console.log('Sending request to /registrations using api instance')

    try {
      console.log('Before api.post')
      const response = await api.post('/registrations', registrationData)

      console.log('After api.post')
      console.log('Response:', response)

      if (response.success && response.data) {
        if (response.data.isWaitlist) {
          alert(`已加入候补队列，您是第${response.data.waitlistPosition}位`)
        } else {
          alert('报名成功！')
        }
        loadEvents()
        loadUserJoinedEvents()
        showRegistrationForm.value = false
      } else {
        alert(`报名失败：${response.message || '未知错误'}`)
      }
    } catch (error: any) {
      console.error('API error:', error)
      const errorMessage = error.response?.data?.message || error.message || '未知错误'
      alert(`报名失败：${errorMessage}`)
    }
  } catch (err: any) {
    console.error('Error in submitRegistration:', err)
    alert(`报名失败：${err.message || '未知错误'}`)
  }
  console.log('submitRegistration finished!')
}

const cancelRegistration = async (eventId: number) => {
  const event = events.value.find(e => e.id === eventId)
  if (!event) return

  if (!confirm('确定要取消报名吗？')) {
    return
  }

  try {
    // 1. 获取用户的报名记录
    const response = await api.get('/registrations/me')
    if (response.success && response.data) {
      const userRegistrations = response.data
      const registration = userRegistrations.find((reg: any) => reg.eventId === eventId)
      if (registration && registration.id) {
        // 1. 只有已付款的用户无法取消报名
        if (registration.paymentId) {
          alert('付款后无法退款，请联系活动主办方')
          return
        }

        // 2. 未付款用户（包括候补）随时可以取消报名
        console.log('=== 未付款用户取消报名 ===')
        console.log('是否候补用户:', registration.isWaitlist)
        console.log('是否已付款:', !!registration.paymentId)
        console.log('结论：未付款，可随时取消')

        // 4. 取消报名
        const cancelResponse = await api.delete(`/registrations/${registration.id}`)
        if (cancelResponse.success) {
          alert('取消报名成功')
          loadEvents()
          loadUserJoinedEvents()
        } else {
          alert(cancelResponse.message || '取消报名失败')
        }
      } else {
        alert('未找到报名记录')
      }
    }
  } catch (error: any) {
    console.error('Error canceling registration:', error)
    alert(`取消报名失败：${error.message || '未知错误'}`)
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

const likeEvent = async (eventId: number) => {
  const accessToken = tokenManager.getAccessToken()
  if (!accessToken) {
    alert(t('pleaseLogin'))
    router.push('/login')
    return
  }

  try {
    console.log('=== 开始点赞活动 ===')
    console.log('Event ID:', eventId)
    console.log('调用API路径:', `/interaction/events/${eventId}/like`)
    const response = await api.post(`/interaction/events/${eventId}/like`)
    console.log('Like response:', response)

    // 实时更新活动列表中的点赞数量
    if (response.success && response.data) {
      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].likeCount = response.data.likeCount || 0
        console.log('实时更新点赞数量:', events.value[eventIndex].likeCount)
      }
    }

    // 同时更新个人中心的点赞数量
    window.dispatchEvent(new CustomEvent('socialDataUpdated'))
  } catch (err) {
    console.error('Error liking event:', err)
  }
}

const favoriteEvent = async (eventId: number) => {
  const accessToken = tokenManager.getAccessToken()
  if (!accessToken) {
    alert(t('pleaseLogin'))
    router.push('/login')
    return
  }

  try {
    console.log('=== 开始收藏活动 ===')
    console.log('Event ID:', eventId)
    console.log('调用API路径:', `/interaction/events/${eventId}/favorite`)
    const response = await api.post(`/interaction/events/${eventId}/favorite`)
    console.log('Favorite response:', response)

    // 实时更新活动列表中的收藏数量
    if (response.success && response.data) {
      const eventIndex = events.value.findIndex(e => e.id === eventId)
      if (eventIndex !== -1) {
        events.value[eventIndex].favoriteCount = response.data.favoriteCount || 0
        console.log('实时更新收藏数量:', events.value[eventIndex].favoriteCount)
      }
    }

    // 同时更新个人中心的收藏数量
    window.dispatchEvent(new CustomEvent('socialDataUpdated'))
  } catch (err) {
    console.error('Error favoriting event:', err)
  }
}

const goToEventDetail = (eventId: number) => {
  console.log('点击活动卡片，跳转到ID:', eventId)
  try {
    router.push(`/event/${eventId}`)
    console.log('router.push 执行成功')
  } catch (err) {
    console.error('跳转失败:', err)
    window.location.href = `/event/${eventId}`
  }
}

const isInWaitlist = (eventId: number) => {
  const event = filteredEvents.value.find((e: any) => e.id === eventId)
  if (!event || !event.waitlist) return false
  const userData = localStorage.getItem('user')
  if (userData) {
    const user = JSON.parse(userData)
    return event.waitlist.some((item: any) => item.userId === user.id)
  }
  return false
}

const getWaitlistPosition = (eventId: number) => {
  const event = filteredEvents.value.find((e: any) => e.id === eventId)
  if (!event || !event.waitlist) return 0
  const userData = localStorage.getItem('user')
  if (userData) {
    const user = JSON.parse(userData)
    const index = event.waitlist.findIndex((item: any) => item.userId === user.id)
    return index >= 0 ? index + 1 : 0
  }
  return 0
}

const hasPaid = (eventId: number) => {
  const registration = registrations.value.find((reg: any) => reg.eventId === eventId)
  return registration && registration.paymentId
}

const isEnded = (event: Event) => {
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

const viewTicket = async (eventId: number) => {
  const accessToken = tokenManager.getAccessToken()
  if (!accessToken) {
    alert('请先登录')
    router.push('/login')
    return
  }

  try {
    const response = await api.get('/registrations/me')
    if (response.success && response.data) {
      const userRegistrations = response.data
      const registration = userRegistrations.find((reg: any) => reg.eventId === eventId)
      if (registration) {
        if (registration.ticketStatus === 'valid') {
          alert(`电子票已生效！\n票号：${registration.ticketId}\n\n请前往活动详情页查看完整电子票二维码`)
        } else if (registration.ticketStatus === 'pending' || !registration.paymentId) {
          alert('请先完成支付，付款成功后电子票自动生效')
        } else if (registration.ticketStatus === 'checked-in') {
          alert('该电子票已使用，已完成签到')
        }
      } else {
        alert('未找到电子票信息')
      }
    }
  } catch (error: any) {
    console.error('Error viewing ticket:', error)
    alert(`查看电子票失败：${error.message || '未知错误'}`)
  }
}
</script>

<template>
  <div class="events-page">
    <div class="header-section">
      <div class="header-container">
        <h1 class="page-title">{{ $t('events') }}</h1>
        <div class="filter-bar">
          <div class="search-section">
            <input
              type="text"
              v-model="searchKeyword"
              :placeholder="$t('searchPlaceholder')"
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <button class="search-btn" @click="handleSearch">
              🔍
            </button>
          </div>
          <div class="filter-section">
            <label>{{ $t('eventCategory') }}:</label>
            <select v-model="selectedCategory" @change="handleCategoryChange">
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="container">
        <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button class="btn btn-primary" @click="loadEvents">重试</button>
        <div class="error-details" v-if="errorDetails">
          {{ errorDetails }}
        </div>
      </div>
      <div v-else class="events-grid">
        <div v-for="event in filteredEvents" :key="event.id" class="event-card" @click="goToEventDetail(event.id)">
          <div class="event-image" v-if="event.coverImage">
            <img :src="event.coverImage" :alt="event.title" />
          </div>
          <div class="event-image placeholder" v-else>
            <div class="placeholder-content">
              <span class="icon">📷</span>
            </div>
          </div>
          <div class="event-info">
            <h3 class="event-title">{{ event.title }}</h3>
            <div class="status-badge" :class="isEnded(event) ? 'ended' : (event.registeredCount < event.capacity ? 'available' : 'full')">
              {{ isEnded(event) ? '已结束' : (event.registeredCount < event.capacity ? '可报名' : '已满') }}
            </div>
            <p class="event-date">{{ formatDate(event.date) }} {{ event.startTime }} - {{ event.endTime }}</p>
            <div class="event-details">
              <span class="detail-item">
                <i class="icon">📍</i>
                {{ event.location }}
              </span>
              <span class="detail-item">
                <i class="icon">👥</i>
                {{ event.registeredCount }} / {{ event.capacity }}
              </span>
              <span class="detail-item">
                <i class="icon">¥</i>
                {{ event.price }}
              </span>
            </div>
            <div class="event-actions">
              <div class="social-buttons">
                <button class="btn btn-social" @click.stop="likeEvent(event.id)">
                  <i class="icon">❤️</i>
                  点赞
                </button>
                <button class="btn btn-social" @click.stop="favoriteEvent(event.id)">
                  <i class="icon">⭐</i>
                  收藏
                </button>
              </div>
              <button
                v-if="isEnded(event)"
                class="btn btn-ended"
                disabled
              >
                ⏹️ 活动已结束
              </button>
              <button
                v-else-if="isAdmin()"
                class="btn btn-disabled"
                disabled
              >
                🔒 管理员无法报名
              </button>
              <template v-else>
                <button
                  v-if="!userJoinedEvents.has(event.id) && !isInWaitlist(event.id)"
                  class="btn btn-primary"
                  @click.stop="openRegistrationForm(event.id)"
                >
                  {{ event.registeredCount < event.capacity ? '立即报名' : '加入候补' }}
                </button>
                <button
                  v-else-if="isInWaitlist(event.id)"
                  class="btn btn-warning"
                  :disabled="true"
                >
                  🕒 候补中，第{{ getWaitlistPosition(event.id) }}位
                </button>
                <button
                  v-else-if="event.price === 0 || hasPaid(event.id)"
                  class="btn btn-primary"
                  @click.stop="viewTicket(event.id)"
                >
                  🎫 查看电子票
                </button>
                <button
                  v-else
                  class="btn btn-danger"
                  @click.stop="cancelRegistration(event.id)"
                >
                  ❌ 取消报名
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredEvents.length === 0" class="no-events">
        {{ $t('noEvents') }}
      </div>
      </div>

      <!-- 分页组件 -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="pagination-btn" :disabled="currentPage === 1" @click="goToPrevPage">
          &lt; 上一页
        </button>
        <span class="pagination-info">
          第 {{ currentPage }}/{{ totalPages }} 页
        </span>
        <button class="pagination-btn" :disabled="currentPage === totalPages" @click="goToNextPage">
          下一页 &gt;
        </button>
      </div>
    </div>

    <!-- 报名表单模态框 -->
    <div v-if="showRegistrationForm" class="modal-overlay" @click="showRegistrationForm = false">
      <div class="modal-content" @click.stop>
        <h3>填写报名信息</h3>
        <form @submit.prevent="submitRegistration">
          <div class="form-group">
            <label>姓名</label>
            <input v-model="registrationForm.contactName" type="text" required />
          </div>
          <div class="form-group">
            <label>手机号码</label>
            <input v-model="registrationForm.contactPhone" type="tel" required />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="showRegistrationForm = false">取消</button>
            <button type="submit" class="btn btn-primary">提交报名</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.events-page {
  min-height: 100vh;
  padding: 2rem 0 4rem;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

.header-section {
  width: 100%;
  margin-bottom: 2rem;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.page-title {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 2rem;
  align-items: center;
  width: 100%;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input {
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 0.95rem;
  width: 280px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.search-btn {
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, #42b883 0%, #38a169 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
}

.filter-section {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-start;
}

.filter-section label {
  color: #555;
  font-weight: 500;
}

.filter-section select {
  padding: 0.6rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-section select:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  width: 100%;
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

.event-title {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  font-weight: 600;
}

.event-date {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 1rem;
  flex: 1;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.8rem;
}

.detail-item .icon {
  font-size: 0.9rem;
  color: #999;
}

.status-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.status-badge.available {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.status-badge.full {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.status-badge.ended {
  background: #f5f5f5;
  color: #9e9e9e;
  border: 1px solid #e0e0e0;
}

.event-actions {
  margin-top: 1rem;
}

.btn {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  border-radius: 4px;
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
  box-shadow: 0 4px 8px rgba(66, 184, 131, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-danger {
  background: #e53e3e;
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #c53030;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(229, 62, 62, 0.3);
}

.btn-warning {
  background: linear-gradient(135deg, #ffa502 0%, #ff6348 100%);
  color: white;
  border: none;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 165, 2, 0.3);
}

.btn-disabled {
  background: #bdc3c7 !important;
  color: #7f8c8d !important;
  border: none !important;
  cursor: not-allowed !important;
  opacity: 0.8;
  box-shadow: none !important;
}

.btn-ended {
  background: #9e9e9e !important;
  color: white !important;
  border: none !important;
  cursor: not-allowed !important;
  opacity: 0.8;
  box-shadow: none !important;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.social-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-social {
  padding: 0.5rem;
  font-size: 0.8rem;
  border: 1px solid #ddd;
  background: white;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-social:hover {
  background: #f5f7fa;
  transform: translateY(-2px);
}

.btn-social i {
  margin-right: 0.3rem;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.social-buttons {
  display: flex;
  gap: 0.5rem;
}

.loading {
  text-align: center;
  padding: 4rem 0;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  text-align: center;
  padding: 4rem 0;
  color: #e74c3c;
}

.no-events {
  text-align: center;
  color: #666;
  padding: 4rem 0;
  font-size: 1.125rem;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
  color: #333;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

/* 分页样式 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: auto;
  padding-top: 3rem;
  padding-bottom: 1rem;
  width: 100%;
}

.pagination-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  background: #f5f5f5;
  color: #666;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 80px;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #eeeeee;
  color: #333;
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  color: #999;
}

.pagination-info {
  font-size: 0.9rem;
  color: #666;
  min-width: 80px;
  text-align: center;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .filter-section {
    width: 100%;
  }

  .filter-section select {
    flex: 1;
  }
}
</style>

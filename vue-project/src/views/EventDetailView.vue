<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'
import QRCode from 'qrcode'
import { tokenManager } from '../utils/tokenManager'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

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
  registeredCount: number
  capacity: number
  price: number
  coverImage?: string
  viewCount: number
  likeCount: number
  favoriteCount: number
  commentCount: number
  status: string
  organizerId: number
  organizer?: {
    id: number
    username: string
    avatar?: string
  }
}

interface ChatMessage {
  id: number
  content: string
  createdAt: string
  user: {
    id: number
    username: string
    avatar?: string
  }
}

const event = ref<Event | null>(null)
const userJoinedEvents = ref<Set<number>>(new Set())
const userRegistrations = ref<any[]>([])
const organizer = ref<any>(null)
const organizerEvents = ref<any[]>([])
const showRegistrationForm = ref(false)
const showChat = ref(false)
const messages = ref<ChatMessage[]>([])
const newMessage = ref('')
const chatLoading = ref(false)
const chatError = ref('')
const registrationForm = ref({
  contactName: '',
  contactPhone: ''
})

onMounted(() => {
  loadEvent()
  loadUserJoinedEvents()
})

const loadEvent = async () => {
  const eventId = Number(route.params.id)
  try {
    const response = await api.get(`/events/${eventId}`)
    if (response && response.success && response.data) {
      event.value = response.data
      console.log('=== 加载活动数据 ===')
      console.log('活动数据:', event.value)
      console.log('commentCount:', event.value.commentCount)
      if (event.value.organizer) {
        organizer.value = event.value.organizer
        await loadOrganizerEvents(event.value.organizerId)
      } else if (event.value.organizerId) {
        await loadOrganizerInfo(event.value.organizerId)
        await loadOrganizerEvents(event.value.organizerId)
      }
      setTimeout(() => {
        loadInteractionStatus()
        loadComments()
      }, 100)
    }
  } catch (error: any) {
    console.error('加载活动错误:', error)
  }
}

const loadOrganizerInfo = async (organizerId: number) => {
  try {
    const response = await api.get(`/users/${organizerId}`)
    if (response && response.success) {
      organizer.value = response.data
    }
  } catch (error) {
    console.error('加载创办者信息失败:', error)
  }
}

const loadOrganizerEvents = async (organizerId: number) => {
  try {
    const response = await api.get(`/events/organizer/${organizerId}`)
    if (response && response.success) {
      organizerEvents.value = response.data
    }
  } catch (error) {
    console.error('加载创办者活动失败:', error)
  }
}

const goToOrganizerProfile = () => {
  if (organizer.value) {
    router.push(`/user/${organizer.value.id}`)
  }
}

const loadUserJoinedEvents = async () => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      const response = await api.get('/registrations/me')
      if (response && response.success && response.data) {
        userRegistrations.value = response.data
        const joinedEventIds = response.data
          .filter((reg: any) => !reg.isWaitlist)
          .map((reg: any) => reg.eventId)
        userJoinedEvents.value = new Set(joinedEventIds)
      }
    } catch (error) {
      console.error('Error loading user joined events:', error)
    }
  }
}

const loadMessages = async () => {
  chatLoading.value = true
  chatError.value = ''
  try {
    if (!event.value) return
    const accessToken = tokenManager.getAccessToken()
    if (!accessToken) return
    const response = await api.get(`/chat/event/${event.value.id}`)
    if (response && response.success && response.data) {
      messages.value = response.data
    }
  } catch (error: any) {
    chatError.value = '加载消息失败'
  } finally {
    chatLoading.value = false
  }
}

const sendMessage = async () => {
  if (!event.value || !newMessage.value.trim()) return
  const accessToken = tokenManager.getAccessToken()
  if (!accessToken) return
  try {
    const response = await api.post(`/chat/event/${event.value.id}`, {
      content: newMessage.value.trim()
    })
    if (response && response.success && response.data) {
      messages.value.push(response.data)
      newMessage.value = ''
    }
  } catch (error: any) {
    window.alert('发送消息失败')
  }
}

const toggleChat = () => {
  const accessToken = tokenManager.getAccessToken()
  if (!accessToken) {
    window.alert(t('pleaseLogin'))
    router.push('/login')
    return
  }
  showChat.value = !showChat.value
  if (showChat.value) {
    loadMessages()
  }
}

const hasJoined = (eventId: number) => {
  return userJoinedEvents.value.has(eventId)
}

const isOrganizer = () => {
  if (!event.value) return false
  const userData = localStorage.getItem('user')
  if (!userData) return false
  const user = JSON.parse(userData)
  return event.value.organizerId === user.id
}

const isAdmin = () => {
  const userData = localStorage.getItem('user')
  if (!userData) return false
  const user = JSON.parse(userData)
  return user.role === 'admin'
}

const isEnded = () => {
  if (!event.value || !event.value.date) return false

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const eventDateParts = event.value.date.split('-')
  const eventYear = parseInt(eventDateParts[0])
  const eventMonth = parseInt(eventDateParts[1]) - 1
  const eventDay = parseInt(eventDateParts[2])
  const eventDate = new Date(eventYear, eventMonth, eventDay)

  if (today > eventDate) {
    return true
  }

  if (today.getTime() === eventDate.getTime() && event.value.endTime) {
    const timeParts = event.value.endTime.split(':')
    const eventEndDateTime = new Date(eventYear, eventMonth, eventDay, parseInt(timeParts[0]), parseInt(timeParts[1]))
    return now > eventEndDateTime
  }

  return false
}

const goToManage = () => {
  router.push(`/event/${event.value.id}/manage`)
}

const openRegistrationForm = (eventId: number) => {
  const accessToken = tokenManager.getAccessToken()
  if (!accessToken) {
    window.alert(t('pleaseLogin'))
    router.push('/login')
    return
  }
  if (isAdmin()) {
    window.alert('管理员账号无法报名活动，请使用普通用户账号')
    return
  }
  if (isEnded()) {
    window.alert('该活动已结束，无法报名')
    return
  }
  registrationForm.value = {
    contactName: '',
    contactPhone: ''
  }
  showRegistrationForm.value = true
}

const joinEvent = (eventId: number) => {
  openRegistrationForm(eventId)
}

const showTicket = ref(false)
const ticketData = ref<any>(null)
const qrCodeDataURL = ref<string>('')

const generateQRCode = async (ticket: any) => {
  try {
    const verifyInfo = {
      ticketNumber: ticket.ticketNumber,
      ticketId: ticket.id,
      eventId: ticket.eventId,
      userId: ticket.userId,
      status: ticket.status,
      issueTime: ticket.createdAt || new Date().toISOString()
    }
    const qrContent = `TICKET:${JSON.stringify(verifyInfo)}`
    const dataURL = await QRCode.toDataURL(qrContent, { width: 200, margin: 2 })
    qrCodeDataURL.value = dataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
  }
}

const viewTicket = async (eventId: number) => {
  const accessToken = tokenManager.getAccessToken()
  if (!accessToken) {
    window.alert('请先登录')
    return
  }
  try {
    console.log('🔍 查找电子票, eventId:', eventId)
    const response = await api.get('/registrations/tickets/me')
    console.log('📋 API返回的所有票:', response.data)

    if (response.success && response.data) {
      // 🧐 详细调试：打印每张票的完整信息
      console.log('📋 所有票详情:')
      response.data.forEach((t: any, index: number) => {
        console.log(`   票${index+1}: id=${t.id}, eventId=${t.eventId}, eventId类型=${typeof t.eventId}, status=${t.status}`)
      })

      console.log('🔍 查找的eventId:', eventId, '类型:', typeof eventId)

      // ✅ 修复类型不匹配问题
      const ticket = response.data.find((t: any) =>
        Number(t.eventId) === Number(eventId)
      )
      console.log('🎫 找到对应票:', ticket)

      if (ticket) {
        if (ticket.status === 'valid') {
          ticketData.value = ticket
          console.log('📦 设置ticketData:', { id: ticket.id, eventId: ticket.eventId })

          if (ticket.qrCode) {
            qrCodeDataURL.value = ticket.qrCode
          } else {
            await generateQRCode(ticket)
          }

          console.log('✅ 设置showTicket = true')
          showTicket.value = true
        } else {
          window.alert(`电子票状态: ${ticket.status}，无法查看`)
        }
      } else {
        window.alert('未找到对应电子票，请确保已完成支付')
      }
    } else {
      window.alert('获取电子票列表失败')
    }
  } catch (error: any) {
    console.error('❌ 查看电子票错误:', error)
    window.alert('查看电子票失败: ' + (error.message || '未知错误'))
  }
}

const submitRegistration = async () => {
  if (!event.value) return
  if (!registrationForm.value.contactName || !registrationForm.value.contactPhone) {
    window.alert('请填写完整的报名信息')
    return
  }
  const accessToken = tokenManager.getAccessToken()
  if (!accessToken) {
    window.alert('请先登录')
    return
  }
  try {
    const registrationData = {
      eventId: event.value.id,
      contactName: registrationForm.value.contactName,
      contactPhone: registrationForm.value.contactPhone,
      quantity: 1,
      totalAmount: event.value.price || 0,
      status: 'pending'
    }
    const response = await api.post('/registrations', registrationData)
    if (response.success && response.data) {
      window.alert('报名成功')
      loadEvent()
      loadUserJoinedEvents()
      showRegistrationForm.value = false
    }
  } catch (error: any) {
    window.alert('报名失败')
  }
}

const leaveEvent = async (eventId: number) => {
  if (!event.value) return
  if (hasJoined(eventId)) {
    try {
      const response = await api.get('/registrations/me')
      if (response.success && response.data) {
        const registration = response.data.find((reg: any) => reg.eventId === eventId)
        if (registration && registration.id) {
          await api.delete(`/registrations/${registration.id}`)
          window.alert('取消报名成功')
          loadEvent()
          loadUserJoinedEvents()
        }
      }
    } catch (error: any) {
      window.alert('取消报名失败')
    }
  }
}

const isInWaitlist = (eventId: number) => {
  if (!event.value) return false
  return false
}

const hasPaid = (eventId: number) => {
  if (!event.value || !userRegistrations.value || !Array.isArray(userRegistrations.value)) {
    return false
  }
  const registration = userRegistrations.value.find((reg: any) => reg.eventId === eventId)
  if (!registration) return false
  return registration.paymentStatus === 'paid' || registration.status === 'approved' && registration.paymentId
}

// 计算距离活动开始还有多久（毫秒）
const getTimeUntilEvent = (): number => {
  if (!event.value?.date || !event.value?.startTime) {
    console.error('❌ 活动日期或时间为空', { event: event.value })
    return -1
  }

  try {
    console.log('📅 活动日期数据:', {
      date: event.value.date,
      startTime: event.value.startTime,
      dateType: typeof event.value.date
    })

    // 处理 ISO 8601 格式日期 (2026-05-02T00:00:00.000Z)
    const dateStr = event.value.date.split('T')[0] // 提取日期部分
    const [year, month, day] = dateStr.split('-').map(Number)

    // 解析时间
    const [hour, minute] = event.value.startTime.split(':').map(Number)

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
      console.error('❌ 日期解析失败:', { year, month, day, hour, minute })
      return -1
    }

    const eventDateTime = new Date(year, month - 1, day, hour, minute)
    const now = new Date()

    const diff = eventDateTime.getTime() - now.getTime()
    console.log('⏰ 时间差:', diff, '活动时间:', eventDateTime.toLocaleString(), '现在:', now.toLocaleString())
    return diff
  } catch (error) {
    console.error('❌ 日期计算异常:', error)
    return -1
  }
}

// 判断是否可以支付（活动开始前2天内）
const canPay = (eventId: number): boolean => {
  if (!hasJoined(eventId)) return false
  if (hasPaid(eventId)) return false

  const timeUntilEvent = getTimeUntilEvent()
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000

  return timeUntilEvent > 0 && timeUntilEvent <= twoDaysInMs
}

// 计算支付倒计时（距离活动开始还有多少天/时/分/秒）
const payCountdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0, canPay: false })
let payCountdownTimer: number | null = null

const updatePayCountdown = () => {
  const timeUntilEvent = getTimeUntilEvent()
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000

  if (timeUntilEvent <= 0) {
    payCountdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0, canPay: false }
    return
  }

  // 计算距离可以支付还有多久（即距离活动开始前2天的时间）
  const timeUntilPayAvailable = timeUntilEvent - twoDaysInMs

  if (timeUntilPayAvailable <= 0) {
    // 已在2天内，可以支付
    payCountdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0, canPay: true }
  } else {
    // 还没到2天内，显示倒计时
    const days = Math.floor(timeUntilPayAvailable / (24 * 60 * 60 * 1000))
    const hours = Math.floor((timeUntilPayAvailable % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((timeUntilPayAvailable % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((timeUntilPayAvailable % (60 * 1000)) / 1000)

    // 修复NaN问题
    if (isNaN(days) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      console.error('❌ 倒计时计算出现NaN，活动日期:', event.value?.date, event.value?.startTime)
      payCountdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0, canPay: false }
    } else {
      payCountdown.value = { days, hours, minutes, seconds, canPay: false }
    }
  }
}

onMounted(() => {
  updatePayCountdown()
  payCountdownTimer = window.setInterval(updatePayCountdown, 1000)
})

onUnmounted(() => {
  if (payCountdownTimer) {
    clearInterval(payCountdownTimer)
  }
})

const goToPayment = (registrationId: number, eventId: number, amount: number) => {
  router.push({
    path: '/payment',
    query: {
      registrationId: String(registrationId),
      eventId: String(eventId),
      amount: String(amount)
    }
  })
}

const goToPaymentForEvent = (eventId: number) => {
  if (!userRegistrations.value || !Array.isArray(userRegistrations.value)) {
    alert('数据加载中，请稍后重试')
    return
  }
  const registration = userRegistrations.value.find((reg: any) => reg.eventId === eventId)
  if (registration) {
    router.push({
      path: '/payment',
      query: {
        registrationId: String(registration.id),
        eventId: String(eventId),
        amount: String(registration.totalAmount || event.value?.price || 0)
      }
    })
  } else {
    alert('报名记录不存在，请取消后重新报名')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

const isLiked = ref(false)
const isFavorited = ref(false)
const userRating = ref(0)
const userRatingContent = ref('')
const hasRated = ref(false)
const showRatingModal = ref(false)
const comments = ref<any[]>([])
const newComment = ref('')
const showCommentInput = ref(false)
const commentsLoading = ref(false)
const activeReplyCommentId = ref<number | null>(null)
const replyContent = ref('')
const activeTab = ref('info')

const loadInteractionStatus = async () => {
  if (!event.value) return
  const userData = JSON.parse(localStorage.getItem('user') || 'null')
  if (!userData) return

  try {
    const [likeRes, favoriteRes, ratingRes] = await Promise.all([
      api.get(`/interaction/events/${event.value.id}/like-status`),
      api.get(`/interaction/events/${event.value.id}/favorite-status`),
      api.get(`/interaction/events/${event.value.id}/rating-status`)
    ])

    if (likeRes.success) {
      isLiked.value = likeRes.data.liked || false
    }
    if (favoriteRes.success) {
      isFavorited.value = favoriteRes.data.favorited || false
    }
    if (ratingRes.success) {
      hasRated.value = ratingRes.data.rated || false
      userRating.value = ratingRes.data.rating || 0
    }
  } catch (err) {
    console.error('加载互动状态失败:', err)
  }
}

const loadComments = async () => {
  if (!event.value) return
  commentsLoading.value = true
  try {
    console.log('=== 加载评论 ===, Event ID:', event.value.id)
    const response = await api.get(`/interaction/events/${event.value.id}/comments`)
    console.log('评论API响应:', response)
    if (response.success) {
      comments.value = response.data || []
      console.log('设置评论数据:', comments.value)
    } else {
      console.error('获取评论失败:', response)
    }
  } catch (err: any) {
    console.error('加载评论失败:', err)
    console.error('错误详情:', err.response?.data)
  } finally {
    commentsLoading.value = false
  }
}

const likeComment = async (comment: any) => {
  const userData = JSON.parse(localStorage.getItem('user') || 'null')
  if (!userData) {
    router.push('/login')
    return
  }
  try {
    const response = await api.post(`/interaction/comments/${comment.id}/like`)
    if (response.success && response.data) {
      comment.isLiked = response.data.liked || false
      comment.likeCount = response.data.likeCount || 0
    }
  } catch (err) {
    console.error('评论点赞失败:', err)
  }
}

const toggleReplyInput = (comment: any) => {
  const userData = JSON.parse(localStorage.getItem('user') || 'null')
  if (!userData) {
    router.push('/login')
    return
  }
  if (activeReplyCommentId.value === comment.id) {
    activeReplyCommentId.value = null
    replyContent.value = ''
  } else {
    activeReplyCommentId.value = comment.id
    replyContent.value = ''
  }
}

const cancelReply = () => {
  activeReplyCommentId.value = null
  replyContent.value = ''
}

const submitReply = async (comment: any) => {
  if (!replyContent.value.trim()) {
    window.alert('请输入回复内容')
    return
  }
  try {
    const response = await api.post(`/interaction/events/${event.value?.id}/comments`, {
      content: replyContent.value.trim(),
      parentId: comment.id
    })
    if (response.success) {
      replyContent.value = ''
      activeReplyCommentId.value = null
      window.alert('回复成功！')
      loadComments()
    } else {
      window.alert(response.message || '回复失败，请重试')
    }
  } catch (err: any) {
    console.error('回复失败详情:', err)
    window.alert(err.response?.data?.message || '回复失败，请重试')
  }
}

const toggleLike = async () => {
  if (!event.value) return
  const userData = JSON.parse(localStorage.getItem('user') || 'null')
  if (!userData) {
    router.push('/login')
    return
  }
  try {
    const response = await api.post(`/interaction/events/${event.value.id}/like`)
    if (response.success && response.data) {
      isLiked.value = response.data.liked || false
      event.value.likeCount = response.data.likeCount || 0
    }
  } catch (err) {
    console.error('点赞失败:', err)
  }
}

const toggleFavorite = async () => {
  if (!event.value) return
  const userData = JSON.parse(localStorage.getItem('user') || 'null')
  if (!userData) {
    router.push('/login')
    return
  }
  try {
    const response = await api.post(`/interaction/events/${event.value.id}/favorite`)
    if (response.success && response.data) {
      isFavorited.value = response.data.favorited || false
      event.value.favoriteCount = response.data.favoriteCount || 0
    }
  } catch (err) {
    console.error('收藏失败:', err)
  }
}

const toggleCommentInput = () => {
  if (!event.value) return
  const userData = JSON.parse(localStorage.getItem('user') || 'null')
  if (!userData) {
    router.push('/login')
    return
  }
  showCommentInput.value = !showCommentInput.value
}

const submitComment = async () => {
  if (!newComment.value.trim()) {
    window.alert('请输入评论内容')
    return
  }
  console.log('=== 提交评论 ===')
  console.log('Event ID:', event.value?.id)
  console.log('评论内容:', newComment.value.trim())
  try {
    const response = await api.post(`/interaction/events/${event.value.id}/comments`, {
      content: newComment.value.trim()
    })
    console.log('API响应:', response)
    if (response.success) {
      newComment.value = ''
      showCommentInput.value = false
      window.alert('评论成功！')
      loadComments()
      if (event.value) {
        event.value.commentCount = (event.value.commentCount || 0) + 1
      }
    } else {
      console.error('API返回失败:', response)
      window.alert(response.message || '评论失败，请重试')
    }
  } catch (err: any) {
    console.error('评论失败详情:', err)
    console.error('错误响应:', err.response?.data)
    window.alert(err.response?.data?.message || '评论失败，请重试')
  }
}

const openRatingModal = () => {
  if (!event.value) return
  const userData = JSON.parse(localStorage.getItem('user') || 'null')
  if (!userData) {
    router.push('/login')
    return
  }
  userRating.value = 0
  showRatingModal.value = true
}

const selectRating = (star: number) => {
  userRating.value = star
  console.log('选择评分:', star)
}

const formatCommentDate = (date: string | Date) => {
  return '今天'
}

const formatCommentTime = (date: string | Date) => {
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const submitRating = async () => {
  if (userRating.value === 0) {
    window.alert('请选择评分')
    return
  }
  console.log('提交评分:', userRating.value)
  try {
    const response = await api.post(`/interaction/events/${event.value.id}/rating`, {
      score: userRating.value,
      content: userRatingContent.value
    })
    console.log('评分响应:', response)
    if (response.success) {
      showRatingModal.value = false
      window.alert('评分成功！')
      hasRated.value = true
    } else {
      window.alert(response.message || '评分失败，请重试')
    }
  } catch (err) {
    console.error('评分失败详情:', err)
    window.alert(err.response?.data?.message || '评分失败，请重试')
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/events')
  }
}

const scrollToSection = (section: string) => {
  activeTab.value = section
  const el = document.getElementById(section)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="event-detail-page">
    <button class="back-button" @click="goBack">← 返回</button>

    <div v-if="event" class="event-content">
      <div class="event-hero">
        <div class="cover-image">
          <img :src="event.coverImage || ''" :alt="event.title" />
          <div class="cover-overlay"></div>
        </div>
        <div class="hero-content">
          <div class="event-badge">{{ event.category }}</div>
          <h1 class="event-title">{{ event.title }}</h1>
          <div class="event-stats">
            <span class="stat-item">👥 {{ event.registeredCount }} 人已报名</span>
            <span class="stat-item">📍 {{ event.location }}</span>
            <span class="stat-item">📅 {{ formatDate(event.date) }} {{ event.startTime }}</span>
          </div>
        </div>
      </div>

      <div class="event-main">
        <div class="event-left">
          <div class="nav-tabs">
            <button class="nav-tab" :class="{ active: activeTab === 'info' }" @click="scrollToSection('info')">活动详情</button>
            <button class="nav-tab" :class="{ active: activeTab === 'location' }" @click="scrollToSection('location')">活动地点</button>
            <button class="nav-tab" :class="{ active: activeTab === 'organizer' }" @click="scrollToSection('organizer')">主办方</button>
            <button class="nav-tab" :class="{ active: activeTab === 'comments' }" @click="scrollToSection('comments')">互动评论</button>
          </div>

          <section id="info" class="content-section">
            <h3 class="section-title">活动详情</h3>
            <div class="description-box">
              <p>{{ event.description }}</p>
            </div>
          </section>

          <section id="location" class="content-section">
            <h3 class="section-title">活动地点</h3>
            <div class="location-card">
              <div class="location-icon">📍</div>
              <div class="location-info">
                <h4>{{ event.location }}</h4>
              </div>
            </div>
          </section>

          <section id="organizer" class="content-section">
            <h3 class="section-title">主办方</h3>
            <div class="organizer-card" @click="goToOrganizerProfile" v-if="organizer">
              <div class="organizer-avatar">
                <img v-if="organizer.avatar" :src="organizer.avatar" :alt="organizer.username" />
                <div v-else class="avatar-placeholder">{{ (organizer.username || 'U').charAt(0) }}</div>
              </div>
              <div class="organizer-info">
                <h4>{{ organizer.username }}</h4>
                <p>{{ organizerEvents.length }} 个活动</p>
              </div>
              <div class="organizer-arrow">→</div>
            </div>
          </section>

          <section id="comments" class="content-section">
            <h3 class="section-title">互动评论</h3>
            <div class="interaction-bar">
              <button class="interaction-btn" :class="{ active: isLiked }" @click="toggleLike">
                <span class="btn-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
                <span class="btn-text">点赞</span>
                <span class="btn-count">{{ event.likeCount }}</span>
              </button>
              <button class="interaction-btn" :class="{ active: isFavorited }" @click="toggleFavorite">
                <span class="btn-icon">{{ isFavorited ? '⭐' : '☆' }}</span>
                <span class="btn-text">收藏</span>
                <span class="btn-count">{{ event.favoriteCount }}</span>
              </button>
              <button class="interaction-btn" @click="openRatingModal">
                <span class="btn-icon">✍️</span>
                <span class="btn-text">评分</span>
              </button>
              <button class="interaction-btn" @click="toggleCommentInput">
                <span class="btn-icon">💬</span>
                <span class="btn-text">评论</span>
                <span class="btn-count">{{ event.commentCount }}</span>
              </button>
            </div>

            <div v-if="showCommentInput" class="comment-input-box">
              <textarea v-model="newComment" placeholder="写下你的评论..." rows="3"></textarea>
              <div class="comment-actions">
                <button class="btn-cancel" @click="toggleCommentInput">取消</button>
                <button class="btn-submit" @click="submitComment">发布评论</button>
              </div>
            </div>

            <div class="comments-list">
              <div v-if="commentsLoading" class="loading-state">加载中...</div>
              <div v-else-if="comments.length === 0" class="empty-state">暂无评论</div>
              <div v-else class="comment-item" v-for="comment in comments" :key="comment.id">
                <div class="comment-avatar">
                  <img v-if="comment.user?.avatar" :src="comment.user.avatar" :alt="comment.user?.username || '用户'" />
                  <div v-else class="avatar-placeholder">{{ (comment.user?.username || 'U').charAt(0) }}</div>
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.user?.username || '用户' }}</span>
                    <span class="comment-time">{{ formatCommentTime(comment.createdAt) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                  <div class="comment-actions">
                    <button class="comment-action-btn" :class="{ active: comment.isLiked }" @click="likeComment(comment)">
                      <span>{{ comment.isLiked ? '❤️' : '🤍' }}</span>
                      <span>{{ comment.likeCount || 0 }}</span>
                    </button>
                    <button class="comment-action-btn" @click="toggleReplyInput(comment)">
                      <span>💬</span>
                      <span>回复</span>
                    </button>
                  </div>

                  <div v-if="activeReplyCommentId === comment.id" class="reply-input-box">
                    <textarea v-model="replyContent" placeholder="写下你的回复..." rows="2"></textarea>
                    <div class="reply-actions">
                      <button class="btn-cancel" @click="cancelReply">取消</button>
                      <button class="btn-submit" @click="submitReply(comment)">发布回复</button>
                    </div>
                  </div>

                  <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
                    <div class="reply-item" v-for="reply in comment.replies" :key="reply.id">
                      <div class="reply-avatar">
                        <img v-if="reply.user?.avatar" :src="reply.user.avatar" :alt="reply.user?.username || '用户'" />
                        <div v-else class="avatar-placeholder">{{ (reply.user?.username || 'U').charAt(0) }}</div>
                      </div>
                      <div class="reply-content">
                        <div class="reply-header">
                          <span class="reply-author">{{ reply.user?.username || '用户' }}</span>
                          <span class="reply-time">{{ formatCommentTime(reply.createdAt) }}</span>
                        </div>
                        <p class="reply-text">{{ reply.content }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="event-right">
          <div class="booking-card">
            <div class="booking-price">
              <span class="price-label">活动费用</span>
              <span class="price-value">
                <span v-if="event.price > 0">¥{{ event.price }}</span>
                <span v-else class="free-tag">免费</span>
              </span>
            </div>

            <div class="booking-info">
              <div class="info-row">
                <span class="info-icon">📅</span>
                <span class="info-text">{{ formatDate(event.date) }} {{ event.startTime }} - {{ event.endTime }}</span>
              </div>
              <div class="info-row">
                <span class="info-icon">📍</span>
                <span class="info-text">{{ event.location }}</span>
              </div>
              <div class="info-row">
                <span class="info-icon">👥</span>
                <span class="info-text">剩余: {{ event.capacity - event.registeredCount }} / {{ event.capacity }}</span>
              </div>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${(event.registeredCount / event.capacity) * 100}%` }"></div>
            </div>

            <div class="booking-actions">
              <button v-if="isOrganizer()" class="btn btn-manage" @click="goToManage">⚙️ 管理活动</button>
              <button v-if="isEnded()" class="btn btn-ended" disabled>⏹️ 活动已结束</button>
              <template v-else>
                <button v-if="isAdmin() && !isOrganizer()" class="btn btn-disabled" disabled>🔒 管理员账号无法报名</button>
                <button v-if="!hasJoined(event.id) && !isOrganizer() && !isAdmin()" class="btn btn-primary" @click="joinEvent(event.id)">立即报名</button>
                <template v-if="hasJoined(event.id) && !isAdmin()">
                  <button v-if="event.price === 0 || hasPaid(event.id)" class="btn btn-primary" @click="viewTicket(event.id)">🎫 查看电子票</button>
                  <button v-else-if="canPay(event.id)" class="btn btn-warning" @click="goToPaymentForEvent(event.id)">💳 立即支付</button>
                  <div v-else-if="hasJoined(event.id)" class="countdown-display">
                    <span class="countdown-text">距支付开放还有</span>
                    <div class="countdown-numbers">
                      <span class="countdown-item">{{ payCountdown.days }}天</span>
                      <span class="countdown-item">{{ payCountdown.hours }}时</span>
                      <span class="countdown-item">{{ payCountdown.minutes }}分</span>
                      <span class="countdown-item">{{ payCountdown.seconds }}秒</span>
                    </div>
                  </div>
                  <button v-if="hasJoined(event.id)" class="btn btn-danger" @click="leaveEvent(event.id)">❌ 取消报名</button>
                </template>
              </template>
              <button class="btn btn-chat" @click="toggleChat">💬 进入聊天室</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showChat" class="chat-overlay" @click.self="toggleChat">
        <div class="chat-container">
          <div class="chat-header">
            <h3>活动聊天室</h3>
            <button class="close-btn" @click="toggleChat">×</button>
          </div>
          <div class="chat-messages">
            <div v-if="chatLoading" class="loading">加载中...</div>
            <div v-else-if="messages.length === 0" class="empty">暂无消息</div>
            <div v-else class="message-list">
              <div v-for="message in messages" :key="message.id" class="message-item">
                <div class="message-avatar">
                  <div class="avatar-placeholder">{{ (message.user?.username || 'U').charAt(0) }}</div>
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-username">{{ message.user?.username }}</span>
                  </div>
                  <div class="message-text">{{ message.content }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <input v-model="newMessage" type="text" placeholder="输入消息..." @keyup.enter="sendMessage" />
            <button class="send-btn" @click="sendMessage">发送</button>
          </div>
        </div>
      </div>

      <div v-if="showRegistrationForm" class="modal-overlay" @click.self="showRegistrationForm = false">
        <div class="modal-content">
          <h3 class="modal-title">填写报名信息</h3>
          <div class="form-group">
            <label>联系人姓名</label>
            <input v-model="registrationForm.contactName" type="text" placeholder="请输入您的姓名" />
          </div>
          <div class="form-group">
            <label>联系电话</label>
            <input v-model="registrationForm.contactPhone" type="tel" placeholder="请输入您的电话号码" />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showRegistrationForm = false">取消</button>
            <button class="btn-submit" @click="submitRegistration">确认报名</button>
          </div>
        </div>
      </div>

      <div v-if="showTicket" class="modal-overlay ticket-modal" @click.self="showTicket = false">
        <div class="modal-content ticket-card">
          <div class="ticket-header">
            <h3 class="modal-title">🎫 电子票</h3>
            <button class="close-btn" @click="showTicket = false">×</button>
          </div>

          <div class="ticket-content" v-if="ticketData">
            <div class="ticket-main">
              <div class="ticket-left">
                <h4 class="ticket-event-title">{{ event?.title }}</h4>
                <div class="ticket-info-list">
                  <div class="ticket-info-item">
                    <span class="ticket-label">📅 活动时间</span>
                    <span class="ticket-value">{{ event?.date }} {{ event?.startTime }}</span>
                  </div>
                  <div class="ticket-info-item">
                    <span class="ticket-label">📍 活动地点</span>
                    <span class="ticket-value">{{ event?.location }}</span>
                  </div>
                  <div class="ticket-info-item">
                    <span class="ticket-label">🎫 票种类型</span>
                    <span class="ticket-value">{{ ticketData.ticketType || '普通票' }}</span>
                  </div>
                  <div class="ticket-info-item">
                    <span class="ticket-label">👤 持票人</span>
                    <span class="ticket-value">{{ user?.username || ticketData.userId }}</span>
                  </div>
                </div>
              </div>

              <div class="ticket-divider"></div>

              <div class="ticket-right">
                <div class="ticket-qr">
                  <img :src="qrCodeDataURL" alt="电子票二维码" />
                  <p class="qr-hint">扫码验票</p>
                </div>
              </div>
            </div>

            <div class="ticket-stub">
              <div class="stub-title">票根</div>
              <div class="stub-info">
                <div class="stub-item">
                  <span class="stub-label">票号</span>
                  <span class="stub-value stub-number">{{ ticketData.ticketNumber?.slice(0, 8) }}...</span>
                </div>
                <div class="stub-item">
                  <span class="stub-label">Ticket ID</span>
                  <span class="stub-value">#{{ ticketData.id }}</span>
                </div>
                <div class="stub-item">
                  <span class="stub-label">状态</span>
                  <span class="stub-value stub-valid">{{ ticketData.status === 'valid' ? '✅ 有效' : '已使用' }}</span>
                </div>
                <div class="stub-item">
                  <span class="stub-label">出票时间</span>
                  <span class="stub-value">{{ ticketData.createdAt?.split('T')[0] || '---' }}</span>
                </div>
              </div>
            </div>

            <div class="ticket-footer">
              <p class="ticket-notice">※ 此电子票是入场唯一凭证，请妥善保管</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showRatingModal" class="modal-overlay" @click.self="showRatingModal = false">
        <div class="modal-content">
          <h3 class="modal-title">活动评分</h3>
          <div class="rating-stars">
            <span v-for="star in 5" :key="star" class="star" :class="{ active: star <= userRating }" @click="selectRating(star)" style="cursor: pointer; user-select: none;">⭐</span>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showRatingModal = false">取消</button>
            <button class="btn-submit" @click="submitRating">提交</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-page">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<style scoped>
.event-detail-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.back-button {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 100;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.event-hero {
  position: relative;
  height: 400px;
  overflow: hidden;
}

.cover-image {
  position: absolute;
  inset: 0;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%);
}

.hero-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 40px 60px;
  color: #fff;
}

.event-badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  font-size: 13px;
  margin-bottom: 16px;
}

.event-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px;
}

.event-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.9;
}

.event-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 40px;
  align-items: start;
}

@media (max-width: 900px) {
  .event-main {
    grid-template-columns: 1fr;
  }

  .event-right {
    order: -1;
    position: sticky;
    top: 20px;
    z-index: 100;
  }

  .booking-card {
    max-width: 400px;
    margin: 0 auto;
  }
}

.event-left {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.nav-tabs {
  display: flex;
  gap: 8px;
  background: #fff;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.nav-tab {
  flex: 1;
  padding: 10px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.nav-tab:hover {
  background: #f0f0f0;
  color: #333;
}

.nav-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.content-section {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
}

.event-left {
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.event-right {
  position: sticky;
  top: 100px;
  z-index: 5;
}

.booking-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.booking-price {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.price-value {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.free-tag {
  font-size: 20px;
  color: #52c41a;
  -webkit-text-fill-color: #52c41a;
}

.booking-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.progress-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.organizer-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.organizer-card:hover {
  background: #f0f5ff;
}

.organizer-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.organizer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.organizer-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.organizer-info {
  flex: 1;
}

.organizer-info h4 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}

.organizer-info p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.organizer-arrow {
  font-size: 18px;
  color: #999;
}

.interaction-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.interaction-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.interaction-btn:hover {
  background: #f8f9fa;
  border-color: #ddd;
}

.interaction-btn.active {
  background: #fff0f6;
  border-color: #ffadd2;
  color: #eb2f96;
}

.interaction-btn .btn-icon {
  font-size: 16px;
}

.interaction-btn .btn-count {
  font-weight: 500;
}

.comment-input-box {
  margin-bottom: 24px;
}

.comment-input-box textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s;
}

.comment-input-box textarea:focus {
  outline: none;
  border-color: #667eea;
}

.comment-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
}

.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.comment-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.comment-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: none;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.comment-action-btn:hover {
  background: #f0f0f0;
  color: #667eea;
}

.comment-action-btn.active {
  color: #ff6b6b;
}

.reply-input-box {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.reply-input-box textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}

.reply-input-box textarea:focus {
  border-color: #667eea;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.replies-section {
  margin-top: 16px;
  padding-left: 16px;
  border-left: 2px solid #e8e8e8;
}

.reply-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.reply-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
}

.reply-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reply-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.reply-author {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.reply-time {
  font-size: 12px;
  color: #999;
}

.reply-text {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.booking-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.countdown-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-radius: 10px;
  border: 1px solid #ffb74d;
  margin-bottom: 8px;
}

.countdown-text {
  font-size: 12px;
  color: #e65100;
  font-weight: 500;
  margin-bottom: 8px;
}

.countdown-numbers {
  display: flex;
  gap: 12px;
}

.countdown-item {
  background: rgba(255, 235, 59, 0.8);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #e65100;
  font-family: 'Courier New', monospace;
  min-width: 45px;
  text-align: center;
}

.btn-chat {
  background: #f0f5ff;
  color: #1890ff;
  border: 1px dashed #91d5ff;
}

.btn-manage {
  background: #f6ffed;
  color: #52c41a;
}

.btn-danger {
  background: #fff1f0;
  color: #ff4d4f;
}

.btn-disabled {
  background: #bdc3c7 !important;
  color: #7f8c8d !important;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: not-allowed !important;
  opacity: 0.8;
  box-shadow: none !important;
}

.btn-ended {
  background: #9e9e9e !important;
  color: white !important;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: not-allowed !important;
  opacity: 0.8;
  box-shadow: none !important;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  max-width: 480px;
  width: 90%;
}

.ticket-card {
  max-width: 600px;
  padding: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%);
}

.ticket-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #42b883 0%, #38a169 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-header .modal-title {
  color: white;
  margin: 0;
  font-size: 1.25rem;
}

.ticket-header .close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.ticket-header .close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ticket-content {
  padding: 24px;
}

.ticket-main {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.ticket-left {
  flex: 1;
}

.ticket-event-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.ticket-info-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ticket-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ticket-label {
  font-size: 0.8rem;
  color: #718096;
  font-weight: 500;
}

.ticket-value {
  font-size: 0.95rem;
  color: #2d3748;
  font-weight: 600;
}

.ticket-divider {
  width: 1px;
  background: repeating-linear-gradient(
    to bottom,
    #e2e8f0 0px,
    #e2e8f0 4px,
    transparent 4px,
    transparent 8px
  );
}

.ticket-right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ticket-qr {
  text-align: center;
}

.ticket-qr img {
  width: 140px;
  height: 140px;
  border: 4px solid white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qr-hint {
  margin: 8px 0 0 0;
  font-size: 0.75rem;
  color: #718096;
  font-weight: 500;
}

.ticket-stub {
  border-top: 2px dashed #cbd5e0;
  padding-top: 16px;
  margin-bottom: 16px;
}

.stub-title {
  font-size: 0.75rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  font-weight: 600;
}

.stub-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stub-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stub-label {
  font-size: 0.7rem;
  color: #a0aec0;
}

.stub-value {
  font-size: 0.85rem;
  color: #4a5568;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.stub-number {
  color: #42b883;
  letter-spacing: 1px;
}

.stub-valid {
  color: #38a169;
}

.ticket-footer {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.ticket-notice {
  margin: 0;
  font-size: 0.75rem;
  color: #a0aec0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eee;
  border-radius: 10px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.rating-stars {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  justify-content: center;
  padding: 20px 0;
  position: relative;
  z-index: 100;
}

.star {
  font-size: 32px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  opacity: 0.4;
  filter: grayscale(1);
  pointer-events: auto;
}

.star:hover {
  transform: scale(1.2);
}

.star.active {
  opacity: 1;
  filter: grayscale(0);
}

.btn-cancel {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.btn-submit {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  cursor: pointer;
}

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.chat-container {
  width: 90%;
  max-width: 420px;
  height: 75vh;
  max-height: 550px;
  background: #1e1e1e;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.chat-header {
  padding: 16px 20px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.chat-header .close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #404040;
  color: #ffffff;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.chat-header .close-btn:hover {
  background: #555555;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #1e1e1e;
}

.chat-messages .loading,
.chat-messages .empty {
  text-align: center;
  padding: 40px 20px;
  color: #888888;
  font-size: 14px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  gap: 10px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #3a3a3a;
}

.message-avatar .avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-header {
  margin-bottom: 4px;
}

.message-username {
  font-size: 12px;
  color: #aaaaaa;
  font-weight: 500;
}

.message-text {
  padding: 10px 14px;
  background: #2d2d2d;
  border-radius: 0 12px 12px 12px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

.chat-input {
  padding: 12px 16px;
  background: #2d2d2d;
  border-top: 1px solid #404040;
  display: flex;
  gap: 10px;
  align-items: center;
}

.chat-input input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #404040;
  border-radius: 20px;
  background: #1e1e1e;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input input::placeholder {
  color: #666666;
}

.chat-input input:focus {
  border-color: #667eea;
}

.chat-input .send-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.chat-input .send-btn:hover {
  transform: scale(1.05);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #555555;
}
</style>

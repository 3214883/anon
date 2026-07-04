<template>
  <div class="settlement-management page-container">
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="page-title">结算管理</h1>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-label">待审核</div>
        <div class="stat-value pending">{{ summary.pendingCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已通过</div>
        <div class="stat-value approved">{{ summary.approvedCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已拒绝</div>
        <div class="stat-value rejected">{{ summary.rejectedCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">累计结算金额</div>
        <div class="stat-value amount">¥{{ summary.totalSettled.toFixed(2) }}</div>
      </div>
    </div>

    <div class="settlement-section">
      <h3>已结束的活动（可申请结算）</h3>
      <div class="events-list">
        <div v-if="endedEvents.length === 0" class="empty-state">
          <p>暂无可结算的活动</p>
        </div>
        <div v-for="event in endedEvents" :key="event.id" class="event-item">
          <div class="event-info">
            <div class="event-cover">
              <img :src="event.coverImage || ''" :alt="event.title" />
            </div>
            <div class="event-details">
              <h4 class="event-title">{{ event.title }}</h4>
              <div class="event-meta">
                <span class="meta-item">👥 {{ event.registeredCount }} 人报名</span>
                <span class="meta-item">📅 {{ formatDate(event.date) }}</span>
              </div>
            </div>
          </div>
          <button
            class="apply-btn"
            :disabled="event.hasSettlement"
            @click="applySettlement(event.id)"
          >
            {{ event.hasSettlement ? '已申请' : '申请结算' }}
          </button>
        </div>
      </div>
    </div>

    <div class="settlement-section">
      <h3>结算记录</h3>
      <div class="settlement-list">
        <div v-if="settlements.length === 0" class="empty-state">
          <p>暂无结算记录</p>
        </div>
        <div v-for="s in settlements" :key="s.id" class="settlement-item">
          <div class="settlement-header">
            <span class="settlement-event">{{ s.eventTitle }}</span>
            <span class="settlement-status" :class="s.status">
              {{ getStatusText(s.status) }}
            </span>
          </div>
          <div class="settlement-details">
            <div class="detail-row">
              <span>参与人数：{{ s.participantCount }} 人</span>
              <span>总金额：¥{{ Number(s.totalAmount).toFixed(2) }}</span>
              <span>平台手续费(5%)：¥{{ Number(s.feeAmount).toFixed(2) }}</span>
            </div>
            <div class="detail-row final">
              <strong>结算金额：¥{{ Number(s.settleAmount).toFixed(2) }}</strong>
            </div>
            <div v-if="s.status === 'rejected'" class="reject-reason">
              拒绝原因：{{ s.rejectReason }}
            </div>
            <div class="settlement-time">
              申请时间：{{ formatDateTime(s.createdAt) }}
            </div>
            <div v-if="s.status === 'approved'" class="settlement-time">
              审核通过时间：{{ formatDateTime(s.approvedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()

const settlements = ref<any[]>([])
const endedEvents = ref<any[]>([])
const summary = ref({
  pendingCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  totalSettled: 0
})

const goBack = () => {
  router.back()
}

const formatDate = (date: any) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatDateTime = (date: any) => {
  if (!date) return '-'
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
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

const loadSettlements = async () => {
  try {
    const response = await api.get('/settlements/my')
    if (response.success) {
      settlements.value = response.data || []
    }
  } catch (err) {
    console.error('加载结算记录失败:', err)
  }
}

const loadSummary = async () => {
  try {
    const response = await api.get('/settlements/summary')
    if (response.success) {
      summary.value = response.data || summary.value
    }
  } catch (err) {
    console.error('加载结算统计失败:', err)
  }
}

const loadEndedEvents = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem('user') || 'null')
    if (!userData) return

    const response = await api.get('/events')
    const settlementRes = await api.get('/settlements/my')
    const settlementsList = settlementRes.data || []

    if (response.success && response.data) {
      const myEvents = (response.data.events || []).filter((e: any) => e.organizerId === userData.id)

      endedEvents.value = myEvents.filter((e: any) => isEnded(e)).map((e: any) => {
        const hasSettlement = settlementsList.some((s: any) => s.eventId === e.id)
        return { ...e, hasSettlement }
      })
    }
  } catch (err) {
    console.error('加载已结束活动失败:', err)
  }
}

const applySettlement = async (eventId: number) => {
  try {
    const response = await api.post('/settlements/apply', { eventId })
    if (response.success) {
      window.alert('结算申请已提交，请等待管理员审核！')
      loadSettlements()
      loadSummary()
      loadEndedEvents()
    } else {
      window.alert(response.message || '申请失败，请重试')
    }
  } catch (err: any) {
    console.error('申请结算失败:', err)
    window.alert(err.response?.data?.message || '申请失败，请重试')
  }
}

onMounted(() => {
  const userData = localStorage.getItem('user')
  if (userData) {
    const user = JSON.parse(userData)
    if (user.role !== 'admin' && !user.isOrganizer) {
      router.push('/profile')
      return
    }
  } else {
    router.push('/login')
    return
  }
  loadSettlements()
  loadSummary()
  loadEndedEvents()
})
</script>

<style scoped>
.settlement-management {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  padding: 8px 16px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.back-btn:hover {
  background: #e0e0e0;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-value.pending {
  color: #f59e0b;
}

.stat-value.approved {
  color: #10b981;
}

.stat-value.rejected {
  color: #ef4444;
}

.stat-value.amount {
  color: #667eea;
}

.settlement-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.settlement-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.events-list,
.settlement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.event-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.event-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.event-cover {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #e0e0e0;
}

.event-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.event-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.apply-btn {
  padding: 10px 24px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #999;
}

.settlement-item {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.settlement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.settlement-event {
  font-size: 16px;
  font-weight: 600;
}

.settlement-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.settlement-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.settlement-status.approved {
  background: #d1fae5;
  color: #059669;
}

.settlement-status.rejected {
  background: #fee2e2;
  color: #dc2626;
}

.settlement-details {
  font-size: 14px;
  color: #555;
}

.detail-row {
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}

.detail-row.final {
  color: #10b981;
  margin-top: 8px;
}

.reject-reason {
  color: #dc2626;
  margin: 8px 0;
  padding: 8px 12px;
  background: #fee2e2;
  border-radius: 4px;
}

.settlement-time {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>

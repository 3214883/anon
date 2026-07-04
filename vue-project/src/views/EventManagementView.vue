<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index'

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
  capacity: number
  price: number
  registeredCount: number
  coverImage: string
  tags: string
  status: string
  organizerId: number
  createdAt: string
}

const events = ref<Event[]>([])
const isEditing = ref(false)
const editForm = ref<Event>({
  id: 0,
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  address: '',
  category: 'other',
  capacity: 10,
  price: 0,
  registeredCount: 0,
  coverImage: '',
  tags: '',
  status: 'pending',
  organizerId: 0,
  createdAt: ''
})
const error = ref('')
const successMessage = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const statusFilter = ref('')
const sponsorFilter = ref('')
const totalEvents = ref(0)

const displayedEvents = computed(() => {
  let result = events.value

  if (statusFilter.value === 'ended') {
    result = result.filter(event => isEnded(event))
  } else if (statusFilter.value) {
    result = result.filter(event => event.status === statusFilter.value)
  }

  if (sponsorFilter.value === 'sponsored') {
    result = result.filter(event => event.isSponsored)
  } else if (sponsorFilter.value === 'not-sponsored') {
    result = result.filter(event => !event.isSponsored)
  }

  return result
})

const totalPages = computed(() => Math.ceil(totalEvents.value / pageSize.value))

const stats = computed(() => {
  const all = events.value.length
  const pending = events.value.filter(e => e.status === 'pending').length
  const published = events.value.filter(e => e.status === 'published').length
  const ended = events.value.filter(e => isEnded(e)).length
  const total = events.value.reduce((sum, e) => sum + e.registeredCount, 0)
  return { all, pending, published, ended, totalRegistrations: total }
})

const user = computed(() => {
  const stored = localStorage.getItem('user')
  return stored ? JSON.parse(stored) : null
})

onMounted(() => {
  if (user.value?.role !== 'admin') {
    router.push('/')
    return
  }
  loadEvents()
})

const goBack = () => {
  if (isEditing.value) {
    isEditing.value = false
  } else {
    router.push('/')
  }
}

const loadEvents = async () => {
  try {
    loading.value = true
    error.value = ''

    const backendStatus = statusFilter.value === 'ended' ? '' : statusFilter.value
    const response = await api.get('/admin/events', {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value,
        status: backendStatus
      }
    })

    if (response.success) {
      events.value = response.data.events.map((e: any) => ({
        ...e,
        isSponsored: e.isSponsored || false
      }))
      totalEvents.value = response.data.pagination?.total || events.value.length
    }
  } catch (err) {
    error.value = '加载活动列表失败'
    console.error('Error loading events:', err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadEvents()
}

const startEdit = (event: Event) => {
  editForm.value = { ...event }
  isEditing.value = true
  error.value = ''
  successMessage.value = ''
}

const saveEvent = async () => {
  if (!editForm.value.title || !editForm.value.description) {
    error.value = '活动标题和描述不能为空'
    return
  }

  try {
    loading.value = true
    error.value = ''

    const response = await api.put(`/admin/events/${editForm.value.id}`, editForm.value)

    if (response.success) {
      await loadEvents()
      isEditing.value = false
      successMessage.value = '活动信息已更新'
      setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (err) {
    error.value = '更新活动信息失败'
    console.error('Error updating event:', err)
  } finally {
    loading.value = false
  }
}

const approveEvent = async (event: Event) => {
  try {
    const response = await api.put(`/admin/events/${event.id}`, {
      ...event,
      status: 'published'
    })

    if (response.success) {
      await loadEvents()
      successMessage.value = '活动已通过审核并发布'
      setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (err) {
    error.value = '操作失败'
    console.error('Error approving event:', err)
  }
}

const rejectEvent = async (event: Event) => {
  try {
    const response = await api.put(`/admin/events/${event.id}`, {
      ...event,
      status: 'rejected'
    })

    if (response.success) {
      await loadEvents()
      successMessage.value = '活动已拒绝'
      setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (err) {
    error.value = '操作失败'
    console.error('Error rejecting event:', err)
  }
}

const toggleSponsor = async (event: any) => {
  try {
    const newSponsorStatus = !event.isSponsored
    const response = await api.put(`/admin/events/${event.id}`, {
      ...event,
      isSponsored: newSponsorStatus
    })

    if (response.success) {
      await loadEvents()
      successMessage.value = newSponsorStatus ? '活动已推上首页精选' : '已取消首页推荐'
      setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (err) {
    error.value = '操作失败'
    console.error('Error toggling sponsor:', err)
  }
}

      const deleteEvent = async (event: Event) => {
        if (!window.confirm(`确定要删除活动「${event.title}」吗？此操作不可恢复！`)) {
          return
        }

        try {
          const response = await api.delete(`/admin/events/${event.id}`)

          if (response.success) {
            await loadEvents()
            successMessage.value = '活动已删除'
            setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (err) {
    error.value = '删除活动失败'
    console.error('Error deleting event:', err)
  }
}

const changePage = (page: number) => {
  currentPage.value = page
  loadEvents()
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

const getStatusBadgeClass = (event: any) => {
  if (isEnded(event)) return 'ended'
  const classes: Record<string, string> = {
    pending: 'warning',
    published: 'success',
    rejected: 'danger',
    draft: 'secondary'
  }
  return classes[event.status] || 'secondary'
}

const getStatusText = (event: any) => {
  if (isEnded(event)) return '已结束'
  const texts: Record<string, string> = {
    pending: '待审核',
    published: '已发布',
    rejected: '已拒绝',
    draft: '草稿'
  }
  return texts[event.status] || event.status
}

const getCategoryText = (category: string) => {
  const texts: Record<string, string> = {
    outdoor: '户外',
    culture: '文化',
    tech: '科技',
    social: '社交',
    sports: '运动',
    game: '游戏',
    drinking: '聚会',
    anime: '动漫',
    other: '其他'
  }
  return texts[category] || category
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-container">
      <div class="page-header">
        <button class="back-btn" @click="goBack">← 返回</button>
        <div class="header-info">
          <h1 class="page-title">活动管理</h1>
          <p class="page-desc">管理平台所有活动，审核和发布活动申请</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-value">{{ stats.all }}</div>
            <div class="stat-label">总活动数</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待审核</div>
          </div>
          <div class="stat-card success">
            <div class="stat-value">{{ stats.published }}</div>
            <div class="stat-label">已发布</div>
          </div>
          <div class="stat-card ended">
            <div class="stat-value">{{ stats.ended }}</div>
            <div class="stat-label">已结束</div>
          </div>
          <div class="stat-card info">
            <div class="stat-value">{{ stats.totalRegistrations }}</div>
            <div class="stat-label">总报名</div>
          </div>
        </div>
      </div>

      <div v-if="successMessage" class="alert success">
        {{ successMessage }}
      </div>
      <div v-if="error" class="alert error">
        {{ error }}
      </div>

      <div class="toolbar">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索活动标题..."
            @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">🔍</button>
        </div>

        <div class="filter-group">
          <select v-model="statusFilter" @change="handleSearch" class="filter-select">
            <option value="">全部状态</option>
            <option value="ended">已结束</option>
            <option value="pending">待审核</option>
            <option value="published">已发布</option>
            <option value="rejected">已拒绝</option>
          </select>
          <select v-model="sponsorFilter" @change="handleSearch" class="filter-select">
            <option value="">全部推荐</option>
            <option value="sponsored">已推荐</option>
            <option value="not-sponsored">未推荐</option>
          </select>
        </div>
      </div>

      <div class="content-card">
        <div v-if="loading && !isEditing" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="!isEditing" class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>活动</th>
                <th>分类</th>
                <th>日期</th>
                <th>报名/容量</th>
                <th>价格</th>
                <th>状态</th>
                <th>首页推荐</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in displayedEvents" :key="event.id">
                <td>{{ event.id }}</td>
                <td class="event-cell">
                  <div class="event-cover" :style="{ backgroundImage: `url(${event.coverImage})` }"></div>
                  <div class="event-info">
                    <div class="event-title">{{ event.title }}</div>
                    <div class="event-location">📍 {{ event.location }}</div>
                  </div>
                </td>
                <td>
                  <span class="category-tag">{{ getCategoryText(event.category) }}</span>
                </td>
                <td class="date-cell">
                  <div>{{ new Date(event.date).toLocaleDateString() }}</div>
                  <div class="time-text">{{ event.startTime }} - {{ event.endTime }}</div>
                </td>
                <td>
                  <span class="registration-count">
                    <strong>{{ event.registeredCount }}</strong> / {{ event.capacity }}
                  </span>
                </td>
                <td>
                  <span v-if="event.price > 0" class="price">¥{{ event.price }}</span>
                  <span v-else class="price free">免费</span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(event)">
                    {{ getStatusText(event) }}
                  </span>
                </td>
                <td>
                  <label class="switch">
                    <input
                      type="checkbox"
                      :checked="event.isSponsored"
                      @change="toggleSponsor(event)"
                      :disabled="isEnded(event)"
                    />
                    <span class="slider"></span>
                  </label>
                </td>
                <td class="actions-cell">
                  <button class="btn-icon edit" @click="startEdit(event)">✏️</button>
                  <button
                    v-if="event.status === 'pending'"
                    class="btn-icon approve"
                    @click="approveEvent(event)"
                    title="通过审核"
                  >✅</button>
                  <button
                    v-if="event.status === 'pending'"
                    class="btn-icon reject"
                    @click="rejectEvent(event)"
                    title="拒绝"
                  >❌</button>
                  <button class="btn-icon delete" @click="deleteEvent(event)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="edit-form">
          <h3>编辑活动</h3>

          <div class="form-group full-width">
            <label>活动标题</label>
            <input v-model="editForm.title" type="text" />
          </div>

          <div class="form-group full-width">
            <label>活动描述</label>
            <textarea v-model="editForm.description" rows="4"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>活动日期</label>
              <input v-model="editForm.date" type="date" />
            </div>
            <div class="form-group">
              <label>开始时间</label>
              <input v-model="editForm.startTime" type="time" />
            </div>
            <div class="form-group">
              <label>结束时间</label>
              <input v-model="editForm.endTime" type="time" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>活动地点</label>
              <input v-model="editForm.location" type="text" />
            </div>
            <div class="form-group">
              <label>详细地址</label>
              <input v-model="editForm.address" type="text" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select v-model="editForm.category">
                <option value="outdoor">户外</option>
                <option value="culture">文化</option>
                <option value="tech">科技</option>
                <option value="social">社交</option>
                <option value="sports">运动</option>
                <option value="game">游戏</option>
                <option value="drinking">聚会</option>
                <option value="anime">动漫</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-group">
              <label>人数上限</label>
              <input v-model.number="editForm.capacity" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>价格 (元)</label>
              <input v-model.number="editForm.price" type="number" min="0" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>活动状态</label>
              <select v-model="editForm.status">
                <option value="pending">待审核</option>
                <option value="published">已发布</option>
                <option value="rejected">已拒绝</option>
              </select>
            </div>
            <div class="form-group">
              <label>标签 (逗号分隔)</label>
              <input v-model="editForm.tags" type="text" placeholder="例如: 徒步,户外,自然" />
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-cancel" @click="isEditing = false">取消</button>
            <button class="btn btn-save" @click="saveEvent" :disabled="loading">
              {{ loading ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>

        <div v-if="!isEditing && totalPages > 1" class="pagination">
          <button
            class="page-btn"
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
          >
            ‹ 上一页
          </button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button
            class="page-btn"
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
          >
            下一页 ›
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #f8fafc 100%);
  padding: 2rem;
}

.admin-container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.back-btn {
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  color: rgba(0, 0, 0, 0.65);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-btn:hover {
  border-color: rgba(66, 184, 131, 0.3);
  color: #42b883;
  transform: translateX(-4px);
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0;
  letter-spacing: -0.02em;
}

.page-desc {
  color: rgba(0, 0, 0, 0.5);
  margin: 0.25rem 0 0 0;
  font-size: 0.95rem;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
  min-width: 80px;
  transition: all 0.3s ease;
}

.stat-card.warning {
  background: linear-gradient(135deg, #fff7e6 0%, #ffedcc 100%);
  border-color: rgba(243, 156, 18, 0.2);
}

.stat-card.success {
  background: linear-gradient(135deg, #e8f8f0 0%, #d4f4e3 100%);
  border-color: rgba(66, 184, 131, 0.2);
}

.stat-card.info {
  background: linear-gradient(135deg, #e6f3ff 0%, #cce5ff 100%);
  border-color: rgba(52, 152, 219, 0.2);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-card.warning .stat-value {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-card.success .stat-value {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-card.info .stat-value {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-card.ended {
  background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
  border-color: rgba(158, 158, 158, 0.2);
}

.stat-card.ended .stat-value {
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 0.25rem;
  font-weight: 600;
}

.alert {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.alert.success {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.1) 0%, rgba(46, 204, 113, 0.05) 100%);
  border: 1px solid rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

.alert.error {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(231, 76, 60, 0.05) 100%);
  border: 1px solid rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.alert.success::before {
  content: '✅';
}

.alert.error::before {
  content: '⚠️';
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}

.search-box input {
  flex: 1;
  padding: 0.875rem 1rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: rgba(66, 184, 131, 0.5);
  box-shadow: 0 0 0 4px rgba(66, 184, 131, 0.1);
}

.search-btn {
  padding: 0.875rem 1.25rem;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(66, 184, 131, 0.3);
}

.filter-group {
  display: flex;
  gap: 0.75rem;
}

.filter-select {
  padding: 0.875rem 1rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  font-size: 0.9rem;
  color: #1a1a2e;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
}

.filter-select:focus {
  outline: none;
  border-color: rgba(66, 184, 131, 0.5);
}

.content-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.loading-state {
  padding: 4rem 2rem;
  text-align: center;
  color: rgba(0, 0, 0, 0.5);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(66, 184, 131, 0.2);
  border-top-color: #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f8f9fa;
}

.data-table th {
  padding: 1rem 1.25rem;
  text-align: left;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  color: #1a1a2e;
}

.data-table tbody tr {
  transition: all 0.3s ease;
}

.data-table tbody tr:hover {
  background: rgba(66, 184, 131, 0.03);
}

.event-cell {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-width: 280px;
}

.event-cover {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-title {
  font-weight: 700;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.event-location {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 0.25rem;
}

.category-tag {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, rgba(66, 184, 131, 0.1) 0%, rgba(52, 152, 219, 0.1) 100%);
  color: #42b883;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.date-cell {
  font-weight: 600;
}

.time-text {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.5);
  margin-top: 0.25rem;
  font-weight: 400;
}

.registration-count {
  font-size: 0.95rem;
}

.registration-count strong {
  color: #42b883;
  font-size: 1.1rem;
}

.price {
  font-weight: 700;
  color: #e67e22;
}

.price.free {
  color: #27ae60;
}

.badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
}

.badge.warning {
  background: linear-gradient(135deg, rgba(243, 156, 18, 0.15) 0%, rgba(230, 126, 34, 0.1) 100%);
  color: #f39c12;
}

.badge.success {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.15) 0%, rgba(46, 204, 113, 0.1) 100%);
  color: #27ae60;
}

.badge.danger {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(192, 57, 43, 0.1) 100%);
  color: #e74c3c;
}

.badge.secondary {
  background: linear-gradient(135deg, rgba(108, 117, 125, 0.15) 0%, rgba(108, 117, 125, 0.1) 100%);
  color: #6c757d;
}

.badge.ended {
  background: linear-gradient(135deg, rgba(158, 158, 158, 0.15) 0%, rgba(158, 158, 158, 0.1) 100%);
  color: #9e9e9e;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background: linear-gradient(135deg, #ffa502 0%, #ff6b6b 100%);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-icon.edit {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.15) 0%, rgba(41, 128, 185, 0.1) 100%);
  color: #3498db;
}

.btn-icon.approve {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.15) 0%, rgba(46, 204, 113, 0.1) 100%);
  color: #27ae60;
}

.btn-icon.reject {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(192, 57, 43, 0.1) 100%);
  color: #e74c3c;
}

.btn-icon.delete {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(192, 57, 43, 0.1) 100%);
  color: #e74c3c;
}

.btn-icon:hover {
  transform: translateY(-2px) scale(1.05);
}

.edit-form {
  padding: 2rem;
}

.edit-form h3 {
  color: #1a1a2e;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  background: #f8f9fa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1a1a2e;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(66, 184, 131, 0.5);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(66, 184, 131, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-cancel {
  background: #f1f3f4;
  color: rgba(0, 0, 0, 0.65);
}

.btn-cancel:hover {
  background: #e9ecef;
}

.btn-save {
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(66, 184, 131, 0.3);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.page-btn {
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  color: #1a1a2e;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: rgba(0, 0, 0, 0.5);
  font-weight: 600;
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .admin-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-stats {
    width: 100%;
    justify-content: flex-start;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

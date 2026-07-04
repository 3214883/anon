<template>
  <div class="event-manage-page">
    <div class="container">
      <div class="page-header">
        <button class="btn btn-back" @click="goBack">← 返回</button>
        <h1>活动管理 - {{ event?.title }}</h1>
      </div>

      <div v-if="event" class="manage-tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'info' }"
          @click="activeTab = 'info'"
        >
          📝 编辑活动信息
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'checkin' }"
          @click="activeTab = 'checkin'"
        >
          ✅ 验票签到
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'participants' }"
          @click="activeTab = 'participants'"
        >
          👥 报名名单
        </button>
      </div>

      <div v-if="event" class="tab-content">
        <div v-if="activeTab === 'info'" class="edit-form">
          <h2>编辑活动信息</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>活动标题</label>
              <input v-model="editForm.title" type="text" />
            </div>
            <div class="form-group">
              <label>活动分类</label>
              <select v-model="editForm.category">
                <option value="tech">技术</option>
                <option value="culture">文化</option>
                <option value="sports">运动</option>
                <option value="social">社交</option>
                <option value="other">其他</option>
              </select>
            </div>
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
            <div class="form-group">
              <label>活动地点</label>
              <input v-model="editForm.location" type="text" />
            </div>
            <div class="form-group">
              <label>活动容量</label>
              <input v-model="editForm.capacity" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>活动价格 (¥)</label>
              <input v-model="editForm.price" type="number" min="0" step="0.01" />
            </div>
          </div>
          <div class="form-group full-width">
            <label>详细地址</label>
            <input v-model="editForm.address" type="text" />
          </div>
          <div class="form-group full-width">
            <label>活动描述</label>
            <textarea v-model="editForm.description" rows="6"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" @click="resetForm">重置</button>
            <button class="btn btn-primary" @click="saveEvent">💾 保存修改</button>
          </div>
        </div>

        <div v-if="activeTab === 'checkin'" class="checkin-section">
          <h2>验票签到</h2>
          <div class="checkin-tabs">
            <button
              class="checkin-tab-btn"
              :class="{ active: checkinMethod === 'scan' }"
              @click="checkinMethod = 'scan'"
            >
              📷 扫码验票
            </button>
            <button
              class="checkin-tab-btn"
              :class="{ active: checkinMethod === 'manual' }"
              @click="checkinMethod = 'manual'"
            >
              ⌨️ 手动输入
            </button>
          </div>

          <div v-if="checkinMethod === 'scan'" class="scan-area">
            <div class="scanner-container">
              <div id="qr-reader" class="qr-reader"></div>
              <div v-if="!scannerRunning" class="scanner-placeholder">
                <div class="scan-icon">📷</div>
                <p>点击下方按钮启动摄像头扫码</p>
                <button class="btn btn-primary" @click="startScanner">
                  启动摄像头扫码
                </button>
              </div>
              <div v-if="scannerRunning" class="scanner-controls">
                <button class="btn btn-danger" @click="stopScanner">
                  停止扫描
                </button>
              </div>
            </div>
            <div class="scan-tips">
              <h4>💡 使用说明</h4>
              <ul>
                <li>点击「启动摄像头扫码」打开摄像头</li>
                <li>将电子票二维码对准摄像头取景框</li>
                <li>系统自动识别并完成验票签到</li>
                <li>建议使用手机或电脑摄像头</li>
              </ul>
            </div>
          </div>

          <div v-if="checkinMethod === 'manual'" class="scan-box">
            <h3>手动输入票号验票</h3>
            <p class="hint">输入报名成功后生成的电子票票号</p>
            <div class="checkin-input">
              <input
                v-model="ticketId"
                type="text"
                placeholder="请输入票号，例如：a1b2c3d4..."
                @keyup.enter="doCheckIn"
              />
              <button class="btn btn-primary" @click="doCheckIn">验票签到</button>
            </div>
          </div>

          <div v-if="checkInResult" class="checkin-result">
            <div class="result-card" :class="checkInResult.success ? 'success' : 'error'">
              <h3>{{ checkInResult.success ? '✅ 签到成功' : '❌ 签到失败' }}</h3>
              <p>{{ checkInResult.message }}</p>
              <div v-if="checkInResult.data" class="result-details">
                <div class="detail-row">
                  <span class="label">姓名：</span>
                  <span class="value">{{ checkInResult.data.contactName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">电话：</span>
                  <span class="value">{{ checkInResult.data.contactPhone }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">签到时间：</span>
                  <span class="value">{{ new Date(checkInResult.data.checkInTime).toLocaleString() }}</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-small" @click="resetCheckIn">继续验票</button>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'participants'" class="participants-section">
          <h2>报名名单</h2>
          <div class="stats-bar">
            <span class="stat">👤 总报名：{{ participants.length }} 人</span>
            <span class="stat">🎫 正式：{{ formalCount }} 人</span>
            <span class="stat">🕒 候补：{{ waitlistCount }} 人</span>
            <span class="stat">✅ 已签到：{{ checkedInCount }} 人</span>
            <span class="stat">💳 已付款：{{ paidCount }} 人</span>
          </div>
          <table class="participants-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>电话</th>
                <th>报名类型</th>
                <th>报名时间</th>
                <th>付款状态</th>
                <th>签到状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in participants" :key="p.id">
                <td>{{ p.contactName }}</td>
                <td>{{ p.contactPhone }}</td>
                <td>
                  <span class="status-badge" :class="p.isWaitlist ? 'waitlist' : 'formal'">
                    {{ p.isWaitlist ? '候补中(第' + p.waitlistPosition + '位)' : '正式报名' }}
                  </span>
                </td>
                <td>{{ new Date(p.createdAt).toLocaleString() }}</td>
                <td>
                  <span class="status-badge" :class="p.paymentId !== null && p.paymentId !== undefined ? 'paid' : 'pending'">
                    {{ p.paymentId !== null && p.paymentId !== undefined ? '已付款' : '未付款' }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" :class="p.checkInTime ? 'checked' : 'waiting'">
                    {{ p.checkInTime ? '已签到' : '未签到' }}
                  </span>
                </td>
                <td>
                  <button
                    v-if="!p.checkInTime && !p.isWaitlist"
                    class="btn btn-small btn-primary"
                    @click="manualCheckIn(p)"
                  >
                    手动签到
                  </button>
                  <span v-else-if="p.isWaitlist" class="text-muted">仅正式可签到</span>
                  <span v-else class="text-muted">已签到</span>
                </td>
              </tr>
              <tr v-if="participants.length === 0">
                <td colspan="6" class="empty-state">暂无报名记录</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../api/index'

const route = useRoute()
const router = useRouter()
const eventId = route.params.id as string

const event = ref<any>(null)
const activeTab = ref('info')
const checkinMethod = ref('scan')
const ticketId = ref('')
const checkInResult = ref<any>(null)
const participants = ref<any[]>([])
const scannerRunning = ref(false)
let html5QrCode: any = null

const editForm = reactive({
  title: '',
  category: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  address: '',
  capacity: 0,
  price: 0,
  description: ''
})

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}

const loadEvent = async () => {
  try {
    const response = await api.get(`/events/${eventId}`)
    if (response.success && response.data) {
      event.value = response.data

      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        if (event.value && event.value.organizerId !== user.id) {
          alert('您不是该活动的举办者，无权管理')
          router.push(`/events/${eventId}`)
          return
        }
      }

      if (event.value) {
        Object.assign(editForm, {
          title: event.value.title,
          category: event.value.category,
          date: event.value.date,
          startTime: event.value.startTime,
          endTime: event.value.endTime,
          location: event.value.location,
          address: event.value.address,
          capacity: event.value.capacity,
          price: event.value.price,
          description: event.value.description
        })

        loadParticipants()
      }
    }
  } catch (error) {
    console.error('加载活动失败:', error)
    alert('加载活动信息失败')
  }
}

const loadParticipants = async () => {
  try {
    const response = await api.get(`/events/${eventId}/participants`)
    if (response.success && response.data) {
      participants.value = response.data
    }
  } catch (error) {
    console.error('加载报名名单失败:', error)
  }
}

const resetForm = () => {
  if (event.value) {
    Object.assign(editForm, {
      title: event.value.title,
      category: event.value.category,
      date: event.value.date,
      startTime: event.value.startTime,
      endTime: event.value.endTime,
      location: event.value.location,
      address: event.value.address,
      capacity: event.value.capacity,
      price: event.value.price,
      description: event.value.description
    })
  }
}

const saveEvent = async () => {
  try {
    const response = await api.put(`/events/${eventId}`, editForm)
    if (response.success) {
      alert('活动信息已更新')
      loadEvent()
    } else {
      alert(`更新失败：${response.message}`)
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    alert(`保存失败：${error.response?.data?.message || '未知错误'}`)
  }
}

const doCheckIn = async () => {
  if (!ticketId.value.trim()) {
    alert('请输入票号')
    return
  }

  try {
    const response = await api.post(`/registrations/checkin/${ticketId.value.trim()}`)
    checkInResult.value = response
    if (response.success) {
      loadParticipants()
    }
  } catch (error: any) {
    checkInResult.value = {
      success: false,
      message: error.response?.data?.message || '签到失败'
    }
  }
}

const manualCheckIn = (registration: any) => {
  ticketId.value = registration.ticketId
  doCheckIn()
}

const resetCheckIn = () => {
  ticketId.value = ''
  checkInResult.value = null
}

const startScanner = async () => {
  try {
    html5QrCode = new Html5Qrcode('qr-reader')

    await html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      onScanSuccess,
      onScanFailure
    )

    scannerRunning.value = true
    checkInResult.value = null
  } catch (error) {
    console.error('启动摄像头失败:', error)
    alert('启动摄像头失败，请允许摄像头权限并重试')
  }
}

const stopScanner = async () => {
  if (html5QrCode && scannerRunning.value) {
    try {
      await html5QrCode.stop()
    } catch (e) {
      console.error('停止扫描器错误:', e)
    }
    scannerRunning.value = false
  }
}

const onScanSuccess = async (decodedText: string) => {
  console.log('扫码成功:', decodedText)

  // ✅ 兼容两种格式: 纯票号 或 tickeT:前缀格式
  let actualTicketId = decodedText

  // 如果有 tickeT: 前缀，提取后面的票号
  if (decodedText.startsWith('tickeT:')) {
    actualTicketId = decodedText.substring(7)
    console.log('提取票号:', actualTicketId)
  }

  ticketId.value = actualTicketId

  await stopScanner()
  doCheckIn()
}

const onScanFailure = (error: any) => {
}

const checkedInCount = computed(() => {
  return participants.value.filter(p => p.checkInTime).length
})

const paidCount = computed(() => {
  return participants.value.filter(p => p.paymentId !== null && p.paymentId !== undefined).length
})

const formalCount = computed(() => {
  return participants.value.filter(p => !p.isWaitlist).length
})

const waitlistCount = computed(() => {
  return participants.value.filter(p => p.isWaitlist).length
})

onMounted(() => {
  loadEvent()
})

onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped>
.event-manage-page {
  min-height: 100vh;
  padding: 2rem 0;
  background: #f5f7fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
}

h1 {
  color: #333;
  font-size: 1.8rem;
  margin: 0;
}

.manage-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 0.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.tab-btn {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.tab-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.tab-content h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e5e5e5;
}

.btn-small {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.checkin-section {
  max-width: 600px;
  margin: 0 auto;
}

.checkin-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 12px;
}

.checkin-tab-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.checkin-tab-btn.active {
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  color: #333;
}

.scan-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.scanner-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  position: relative;
  min-height: 320px;
}

.qr-reader {
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.scanner-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 280px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  background: white;
}

.scan-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.scanner-placeholder p {
  color: #888;
  margin-bottom: 1.5rem;
}

.scanner-controls {
  margin-top: 1rem;
}

.scan-tips {
  background: #e8f4fd;
  border-radius: 12px;
  padding: 1.5rem;
  color: #0c5460;
}

.scan-tips h4 {
  margin-bottom: 1rem;
  color: #0c5460;
}

.scan-tips ul {
  margin: 0;
  padding-left: 1.25rem;
}

.scan-tips li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.scan-box {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.scan-box h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.hint {
  color: #888;
  margin-bottom: 1.5rem;
}

.checkin-input {
  display: flex;
  gap: 0.5rem;
}

.checkin-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.checkin-result {
  margin-top: 2rem;
}

.result-card {
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.result-card.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.result-card.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

@media (max-width: 768px) {
  .scan-area {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .stats-bar {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .participants-table {
    display: block;
    overflow-x: auto;
  }
}

.result-card h3 {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.result-details {
  margin: 1rem 0;
  text-align: left;
  background: rgba(255,255,255,0.5);
  padding: 1rem;
  border-radius: 8px;
}

.detail-row {
  display: flex;
  margin-bottom: 0.5rem;
}

.detail-row .label {
  font-weight: 600;
  width: 80px;
}

.stats-bar {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stat {
  font-weight: 500;
  color: #555;
}

.participants-table {
  width: 100%;
  border-collapse: collapse;
}

.participants-table th,
.participants-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.participants-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
}

.participants-table tbody tr:hover {
  background: #f8f9fa;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.paid {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.checked {
  background: #d4edda;
  color: #155724;
}

.status-badge.waiting {
  background: #e2e3e5;
  color: #383d41;
}

.status-badge.formal {
  background: #cce5ff;
  color: #004085;
}

.status-badge.waitlist {
  background: #ffeeba;
  color: #856404;
}

.empty-state {
  text-align: center;
  padding: 3rem !important;
  color: #999;
}

.text-muted {
  color: #999;
}
</style>

<template>
  <div class="check-in-page">
    <div class="container">
      <h1>扫码签到</h1>
      <div class="check-in-content">
        <div class="scan-area">
          <h2>扫描电子票二维码</h2>
          <div class="scan-placeholder">
            <span>请使用扫码设备扫描电子票上的二维码</span>
          </div>
        </div>
        <div class="manual-input">
          <h3>或手动输入票号</h3>
          <div class="form-group">
            <label for="ticketId">票号</label>
            <input
              type="text"
              id="ticketId"
              v-model="ticketId"
              placeholder="请输入电子票上的票号"
              @keyup.enter="checkIn"
            />
          </div>
          <button class="btn btn-primary" @click="checkIn">签到</button>
        </div>
      </div>
      <div v-if="checkInResult" class="result-container">
        <div class="result-card" :class="checkInResult.success ? 'success' : 'error'">
          <h3>{{ checkInResult.success ? '签到成功' : '签到失败' }}</h3>
          <p>{{ checkInResult.message }}</p>
          <div v-if="checkInResult.data" class="result-data">
            <div class="data-item">
              <span class="label">活动名称:</span>
              <span class="value">{{ checkInResult.data.event?.title }}</span>
            </div>
            <div class="data-item">
              <span class="label">联系人:</span>
              <span class="value">{{ checkInResult.data.contactName }}</span>
            </div>
            <div class="data-item">
              <span class="label">联系电话:</span>
              <span class="value">{{ checkInResult.data.contactPhone }}</span>
            </div>
            <div class="data-item">
              <span class="label">签到时间:</span>
              <span class="value">{{ new Date(checkInResult.data.checkInTime).toLocaleString() }}</span>
            </div>
          </div>
          <button class="btn btn-secondary" @click="resetCheckIn">返回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const ticketId = ref('')
const checkInResult = ref<any>(null)

const checkIn = async () => {
  if (!ticketId.value.trim()) {
    alert('请输入票号')
    return
  }

  try {
    const response = await api.post(`/registrations/checkin/${ticketId.value.trim()}`)

    if (response.success) {
      checkInResult.value = response
    } else {
      checkInResult.value = {
        success: false,
        message: response.message || '签到失败'
      }
    }
  } catch (error: any) {
    console.error('Check-in error:', error)
    checkInResult.value = {
      success: false,
      message: error.response?.data?.message || '签到失败'
    }
  }
}

const resetCheckIn = () => {
  ticketId.value = ''
  checkInResult.value = null
}

// 从URL参数中获取ticketId并自动签到
onMounted(() => {
  const urlTicketId = route.query.ticketId as string
  if (urlTicketId) {
    ticketId.value = urlTicketId
    checkIn()
  }
})
</script>

<style scoped>
.check-in-page {
  min-height: 100vh;
  padding: 2rem 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  text-align: center;
  margin-bottom: 3rem;
  color: white;
  font-size: 2.5rem;
}

.check-in-content {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.scan-area {
  margin-bottom: 2rem;
  text-align: center;
}

.scan-area h2 {
  margin-bottom: 1.5rem;
  color: white;
}

.scan-placeholder {
  width: 100%;
  height: 300px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-placeholder span {
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
}

.manual-input {
  margin-top: 2rem;
}

.manual-input h3 {
  margin-bottom: 1.5rem;
  color: white;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 200px;
}

.btn-primary {
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(66, 184, 131, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.result-container {
  margin-top: 2rem;
}

.result-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.result-card.success {
  border-color: #42b883;
  background: rgba(66, 184, 131, 0.1);
}

.result-card.error {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.result-card h3 {
  margin-bottom: 1rem;
  color: white;
}

.result-card p {
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.result-data {
  margin-bottom: 2rem;
  text-align: left;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.data-item:last-child {
  border-bottom: none;
}

.data-item .label {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.data-item .value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}

@media (max-width: 768px) {
  h1 {
    font-size: 2rem;
  }

  .scan-placeholder {
    height: 200px;
  }

  .check-in-content {
    padding: 1.5rem;
  }
}
</style>

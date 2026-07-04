<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()

const payments = ref<any[]>([])
const loading = ref(false)
const error = ref('')

interface Payment {
  id: number
  orderId: string
  amount: number
  status: string
  paymentMethod: string
  createdAt: string
  eventTitle: string
}

onMounted(() => {
  loadPaymentHistory()
})

const loadPaymentHistory = async () => {
  loading.value = true
  error.value = ''
  try {
    // 从API获取支付记录
    const response = await api.get('/payments/history')
    if (response.success && response.data) {
      payments.value = response.data
    }
  } catch (err: any) {
    error.value = err.message || '加载支付记录失败'
    console.error('Error loading payment history:', err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/wallet')
  }
}
</script>

<template>
  <div class="payment-history-page">
    <!-- 顶部导航 -->
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">{{ t('paymentHistory') }}</h1>
      <div class="header-actions"></div>
    </div>

    <div class="page-container">
      <!-- 支付记录列表 -->
      <div v-if="loading" class="loading">
        {{ t('loading') }}
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else-if="payments.length === 0" class="no-payments">
        {{ t('noPaymentHistory') }}
      </div>
      <div v-else class="payments-list">
        <div
          v-for="payment in payments"
          :key="payment.id"
          class="payment-card"
        >
          <div class="payment-header">
            <h3 class="event-title">{{ payment.eventTitle }}</h3>
            <span class="payment-status" :class="payment.status">
              {{ payment.status === 'completed' ? t('completed') : t('pending') }}
            </span>
          </div>
          <div class="payment-details">
            <div class="detail-row">
              <span class="detail-label">{{ t('orderId') }}:</span>
              <span class="detail-value">{{ payment.orderId }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('amount') }}:</span>
              <span class="detail-value amount">¥{{ payment.amount }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('paymentMethod') }}:</span>
              <span class="detail-value">{{ payment.paymentMethod }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('paymentDate') }}:</span>
              <span class="detail-value">{{ new Date(payment.createdAt).toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <div class="bottom-nav">
      <div class="nav-item" @click="router.push('/')">
        <div class="nav-icon">🏠</div>
        <div class="nav-label">{{ $t('home') }}</div>
      </div>
      <div class="nav-item" @click="router.push('/create-event')">
        <div class="nav-icon create-icon">+</div>
        <div class="nav-label">{{ $t('create') }}</div>
      </div>
      <div class="nav-item active" @click="router.push('/profile')">
        <div class="nav-icon">👤</div>
        <div class="nav-label">{{ $t('my') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-history-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: white;
  padding-bottom: 70px; /* 为底部导航栏留出空间 */
}

.page-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 1rem;
}

/* 顶部导航 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  max-width: 600px;
  margin: 0 auto;
  border-radius: 8px 8px 0 0;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.back-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* 加载和错误状态 */
.loading,
.error,
.no-payments {
  text-align: center;
  padding: 4rem 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.125rem;
}

.error {
  color: #e74c3c;
}

/* 支付记录列表 */
.payments-list {
  margin-top: 1rem;
}

.payment-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.payment-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.event-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.payment-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.payment-status.completed {
  background: rgba(66, 184, 131, 0.2);
  border: 1px solid rgba(66, 184, 131, 0.4);
  color: #42b883;
}

.payment-status.pending {
  background: rgba(241, 196, 15, 0.2);
  border: 1px solid rgba(241, 196, 15, 0.4);
  color: #f1c40f;
}

.payment-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.detail-value {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
}

.detail-value.amount {
  font-size: 1rem;
  font-weight: 600;
  color: #42b883;
}

/* 底部导航栏 */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 0;
  z-index: 1000;
  border-radius: 0 0 8px 8px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.5rem;
  border-radius: 8px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: #42b883;
}

.nav-icon {
  font-size: 1.25rem;
}

.create-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  transform: translateY(-10px);
  box-shadow: 0 4px 15px rgba(66, 184, 131, 0.4);
}

.nav-label {
  font-size: 0.75rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .payment-history-page {
    padding-bottom: 60px;
  }

  .header {
    padding: 0.75rem;
  }

  .payment-card {
    padding: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .event-title {
    font-size: 1rem;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .detail-label {
    font-size: 0.8125rem;
  }

  .detail-value {
    font-size: 0.8125rem;
  }

  .bottom-nav {
    padding: 0.5rem 0;
  }

  .nav-icon {
    font-size: 1.125rem;
  }

  .create-icon {
    width: 36px;
    height: 36px;
    font-size: 1.25rem;
  }
}
</style>

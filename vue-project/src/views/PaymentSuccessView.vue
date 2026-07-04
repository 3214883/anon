<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api/index'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const success = ref(false)
const orderInfo = ref({
  out_trade_no: '',
  trade_no: '',
  total_amount: '',
  subject: ''
})

onMounted(() => {
  const query = route.query

  console.log('支付宝同步回调参数:', query)

  orderInfo.value = {
    out_trade_no: (query.out_trade_no as string) || '',
    trade_no: (query.trade_no as string) || '',
    total_amount: (query.total_amount as string) || '',
    subject: (query.subject as string) || ''
  }

  setTimeout(() => {
    loading.value = false
    success.value = true
  }, 1500)
})

const goToEventDetail = () => {
  router.push('/events')
}

const goToMyEvents = () => {
  router.push('/my-events')
}
</script>

<template>
  <div class="payment-success-page">
    <div class="success-container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>正在确认支付结果...</p>
      </div>

      <div v-else class="success-content">
        <div class="success-icon">✅</div>
        <h1>支付成功！</h1>

        <div class="order-summary">
          <h3>订单信息</h3>
          <div class="summary-item">
            <span class="label">活动名称</span>
            <span class="value">{{ orderInfo.subject || '活动报名' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">支付金额</span>
            <span class="value amount">¥{{ orderInfo.total_amount || '0.00' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">商户订单号</span>
            <span class="value order-id">{{ orderInfo.out_trade_no }}</span>
          </div>
          <div v-if="orderInfo.trade_no" class="summary-item">
            <span class="label">支付宝交易号</span>
            <span class="value order-id">{{ orderInfo.trade_no }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="secondary-button" @click="goToMyEvents">
            查看我的活动
          </button>
          <button class="primary-button" @click="goToEventDetail">
            浏览活动列表
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-success-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.success-container {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.loading-state {
  padding: 2rem 0;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1.5rem;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #1677ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  font-size: 1rem;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: bounce 0.6s ease-out;
}

@keyframes bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.success-content h1 {
  margin: 0 0 2rem 0;
  color: #52c41a;
  font-size: 2rem;
  font-weight: 700;
}

.order-summary {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
}

.order-summary h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.1rem;
  text-align: center;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  color: #666;
  font-size: 0.9rem;
}

.summary-item .value {
  color: #333;
  font-weight: 600;
  font-size: 0.9rem;
}

.summary-item .value.amount {
  color: #f5222d;
  font-size: 1.2rem;
  font-weight: 700;
}

.summary-item .value.order-id {
  font-family: monospace;
  font-size: 0.8rem;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.primary-button, .secondary-button {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.primary-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.secondary-button {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.secondary-button:hover {
  background: #f0f5ff;
  transform: translateY(-2px);
}
</style>

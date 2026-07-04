<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const error = ref('')
const success = ref('')
const paymentStep = ref<'select' | 'qrcode' | 'processing' | 'success' | 'error'>('select')

const orderInfo = ref({
  orderId: '',
  paymentId: 0,
  qrCodeUrl: '',
  amount: 0,
  subject: ''
})

const paymentForm = ref({
  registrationId: '',
  eventId: '',
  amount: 0,
  paymentMethod: 'wallet'
})

const eventInfo = ref({
  title: '',
  price: 0
})

const walletBalance = ref(0)

let statusPollingTimer: number | null = null
let countdownTimer: number | null = null

const remainingSeconds = ref(30 * 60)
const countdownDisplay = ref('')

const loadWalletBalance = async () => {
  try {
    const response = await api.get('/wallet/balance')
    if (response.success) {
      walletBalance.value = response.data.balance || 0
    }
  } catch (err) {
    console.error('加载钱包余额失败:', err)
  }
}

const handlePayment = () => {
  if (paymentForm.value.paymentMethod === 'wallet') {
    doWalletPayment()
  } else if (paymentForm.value.paymentMethod === 'alipay_web') {
    createAlipayWebPayment()
  } else {
    createAlipayPayment()
  }
}

const getPaymentButtonText = () => {
  switch (paymentForm.value.paymentMethod) {
    case 'wallet':
      return '确认钱包支付'
    case 'alipay_web':
      return '前往支付宝网页支付'
    default:
      return '生成支付宝付款码'
  }
}

const doWalletPayment = async () => {
  if (Number(walletBalance.value) < Number(paymentForm.value.amount)) {
    error.value = `钱包余额不足，当前: ¥${walletBalance.value.toFixed(2)}，需要: ¥${paymentForm.value.amount.toFixed(2)}，请先充值`
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/payments/wallet/pay', {
      registrationId: Number(paymentForm.value.registrationId),
      eventId: Number(paymentForm.value.eventId),
      amount: paymentForm.value.amount
    })

    if (response.success) {
      paymentStep.value = 'success'
    } else {
      error.value = response.message || '支付失败'
    }
  } catch (err: any) {
    console.error('钱包支付失败:', err)
    error.value = err.response?.data?.message || '支付失败，请重试'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const registrationId = route.query.registrationId as string
  const eventId = route.query.eventId as string
  const amount = route.query.amount as string

  if (registrationId && eventId) {
    paymentForm.value.registrationId = registrationId
    paymentForm.value.eventId = eventId
    if (amount) {
      paymentForm.value.amount = parseFloat(amount)
    }
    loadEventInfo(Number(eventId))
    loadWalletBalance()
  } else {
    error.value = '支付参数错误，请重新从活动详情页进入支付'
  }
})

const loadEventInfo = async (eventId: number) => {
  try {
    const response = await api.get(`/events/${eventId}`)
    if (response.success && response.data) {
      eventInfo.value.title = response.data.title
      paymentForm.value.amount = response.data.price || 0
    }
  } catch (err) {
    console.error('Error loading event info:', err)
    error.value = '加载活动信息失败'
  }
}

const createAlipayPayment = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/payments/alipay/create', {
      registrationId: Number(paymentForm.value.registrationId),
      eventId: Number(paymentForm.value.eventId),
      amount: paymentForm.value.amount
    })

    if (response.success && response.data) {
      orderInfo.value = {
        orderId: response.data.orderId,
        paymentId: response.data.paymentId,
        qrCodeUrl: response.data.qrCodeUrl,
        amount: response.data.amount,
        subject: response.data.subject
      }
      paymentStep.value = 'qrcode'
      startStatusPolling()
    } else {
      error.value = '创建支付宝订单失败'
    }
  } catch (err: any) {
    console.error('Error creating alipay payment:', err)
    error.value = err.message || '创建支付订单失败'
  } finally {
    loading.value = false
  }
}

const createAlipayWebPayment = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/payments/alipay/create-web', {
      registrationId: Number(paymentForm.value.registrationId),
      eventId: Number(paymentForm.value.eventId),
      amount: paymentForm.value.amount
    })

    if (response.success && response.data) {
      orderInfo.value = {
        orderId: response.data.orderId,
        paymentId: response.data.paymentId,
        qrCodeUrl: response.data.qrCodeUrl,
        amount: response.data.amount,
        subject: response.data.subject
      }

      if (response.data.payUrl) {
        console.log('跳转到支付宝:', response.data.payUrl)
        window.open(response.data.payUrl, '_blank')
      }

      paymentStep.value = 'processing'
      startStatusPolling()
    } else {
      error.value = '创建支付宝订单失败'
    }
  } catch (err: any) {
    console.error('Error creating alipay web payment:', err)
    error.value = err.message || '创建支付订单失败'
  } finally {
    loading.value = false
  }
}

const startCountdown = () => {
  updateCountdownDisplay()
  countdownTimer = window.setInterval(() => {
    remainingSeconds.value--
    updateCountdownDisplay()

    if (remainingSeconds.value <= 0) {
      stopCountdown()
      paymentStep.value = 'error'
      error.value = '支付超时，订单已自动取消，请重新报名'
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const updateCountdownDisplay = () => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  countdownDisplay.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const startStatusPolling = () => {
  startCountdown()
  statusPollingTimer = window.setInterval(async () => {
    try {
      const response = await api.get(`/payments/alipay/status/${orderInfo.value.orderId}`)
      if (response.success && response.data) {
        const status = response.data.status
        if (status === 'completed') {
          clearInterval(statusPollingTimer!)
          stopCountdown()
          paymentStep.value = 'success'
        }
      }
    } catch (err) {
      console.error('Polling error:', err)
    }
  }, 2000)
}

const cancelPayment = () => {
  stopCountdown()
  if (statusPollingTimer) {
    clearInterval(statusPollingTimer)
    statusPollingTimer = null
  }
  paymentStep.value = 'select'
}

const openAlipayWebPage = () => {
  if (!orderInfo.value.payUrl) return
  window.open(orderInfo.value.payUrl, '_blank')
}

const simulatePayment = async () => {
  try {
    const response = await api.post('/payments/alipay/simulate-success', {
      orderId: orderInfo.value.orderId
    })

    if (response.success) {
      clearInterval(statusPollingTimer!)
      paymentStep.value = 'success'
    } else {
      error.value = '模拟支付失败'
    }
  } catch (err: any) {
    console.error('Error simulating payment:', err)
    error.value = err.message || '模拟支付失败'
  }
}

const goBack = () => {
  stopCountdown()
  if (statusPollingTimer) {
    clearInterval(statusPollingTimer)
  }
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}

onUnmounted(() => {
  stopCountdown()
  if (statusPollingTimer) {
    clearInterval(statusPollingTimer)
  }
})

const goToPaymentHistory = () => {
  router.push('/payment-history')
}
</script>

<template>
  <div class="payment-page">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">{{ t('payment') }}</h1>
      <div class="header-actions"></div>
    </div>

    <div class="page-container">
      <div v-if="paymentStep === 'select'" class="payment-form">
        <h2 class="form-title">{{ eventInfo.title || t('payment') }}</h2>

        <div class="form-group">
          <label class="form-label">{{ t('amount') }}</label>
          <div class="amount-display">¥{{ paymentForm.amount.toFixed(2) }}</div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('paymentMethod') }}</label>
          <div class="payment-methods">
            <div
              class="payment-method wallet-method"
              :class="{ active: paymentForm.paymentMethod === 'wallet' }"
              @click="paymentForm.paymentMethod = 'wallet'"
            >
              <div class="method-icon">💰</div>
              <div class="method-name">钱包支付</div>
              <div class="method-desc">余额: ¥{{ walletBalance.toFixed(2) }}</div>
            </div>

            <div
              class="payment-method alipay-method"
              :class="{ active: paymentForm.paymentMethod === 'alipay_sandbox' }"
              @click="paymentForm.paymentMethod = 'alipay_sandbox'"
            >
              <div class="method-icon">📱</div>
              <div class="method-name">扫码支付</div>
              <div class="method-desc">支付宝沙箱扫码测试</div>
            </div>

            <div
              class="payment-method alipay-method"
              :class="{ active: paymentForm.paymentMethod === 'alipay_web' }"
              @click="paymentForm.paymentMethod = 'alipay_web'"
            >
              <div class="method-icon">🌐</div>
              <div class="method-name">网页支付</div>
              <div class="method-desc">跳转支付宝沙箱网页</div>
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button
          class="submit-button"
          @click="handlePayment()"
          :disabled="loading"
        >
          <span v-if="loading">{{ t('processing') }}...</span>
          <span v-else>{{ getPaymentButtonText() }}</span>
        </button>
      </div>

      <div v-if="paymentStep === 'processing'" class="processing-container">
        <div class="countdown-badge">
          <span class="countdown-label">⏱️ 支付剩余时间</span>
          <span class="countdown-time">{{ countdownDisplay }}</span>
        </div>

        <div class="processing-icon">🌐</div>
        <h2>正在跳转支付宝沙箱支付...</h2>
        <p class="amount-large">¥{{ orderInfo.amount.toFixed(2) }}</p>
        <div class="spinner"></div>
        <p class="processing-hint">
          ✅ 支付宝支付页面已在新窗口打开
        </p>
        <p class="processing-tip">
          如果没有看到支付窗口，请检查浏览器的弹窗拦截设置
        </p>

        <div class="processing-buttons">
          <button class="manual-jump-button" @click="openAlipayWebPage">
            🔄 手动重新打开支付页面
          </button>
          <button class="cancel-payment-button" @click="cancelPayment">
            ❌ 取消支付
          </button>
        </div>

        <div class="order-info processing-order">
          <p class="order-title">{{ orderInfo.subject }}</p>
          <p class="order-id">订单号: {{ orderInfo.orderId }}</p>
          <p class="polling-hint">🔄 正在自动检测支付结果...</p>
        </div>
      </div>

      <div v-if="paymentStep === 'qrcode'" class="qrcode-container">
        <div class="countdown-badge">
          <span class="countdown-label">⏱️ 支付剩余时间</span>
          <span class="countdown-time">{{ countdownDisplay }}</span>
        </div>

        <div class="qrcode-header">
          <div class="alipay-logo">🔵</div>
          <h2>支付宝扫码支付</h2>
          <p class="amount-large">¥{{ orderInfo.amount.toFixed(2) }}</p>
        </div>

        <div class="qrcode-display">
          <img :src="orderInfo.qrCodeUrl" alt="支付宝付款码" class="qrcode-image" />
        </div>
        <p class="scan-hint-text">📱 使用支付宝APP扫码支付</p>

        <div class="order-info">
          <p class="order-title">{{ orderInfo.subject }}</p>
          <p class="order-id">订单号: {{ orderInfo.orderId }}</p>
          <p class="polling-hint">🔄 正在等待支付...</p>
        </div>

        <div class="simulate-section">
          <div class="sandbox-tips">
            <p class="tips-title">💡 支付宝沙箱测试说明</p>
            <ul class="tips-list">
              <li>🌐 <strong>推荐：网页支付</strong> → 跳转沙箱登录页直接付款</li>
              <li>📱 <strong>扫码支付</strong> → 需下载沙箱版支付宝APP扫码</li>
              <li>👤 沙箱买家账号: <code>gchgkw0223@sandbox.com</code></li>
              <li>🔑 登录密码/支付密码: <code>111111</code></li>
              <li>💰 账户余额: <strong>1,000,000.00 元</strong></li>
            </ul>
          </div>
          <p class="simulate-hint">👇 或者直接点击下方按钮跳过扫码</p>
          <button class="simulate-button" @click="simulatePayment">
            ✅ 模拟支付成功
          </button>
        </div>

        <button class="cancel-button" @click="goBack">
          取消支付
        </button>
      </div>

      <div v-if="paymentStep === 'success'" class="success-container">
        <div class="success-icon">✅</div>
        <h2 class="success-title">支付成功！</h2>
        <p class="success-message">
          您已成功支付 ¥{{ (orderInfo.amount || paymentForm.amount).toFixed(2) }}
        </p>
        <p class="success-desc">电子票已自动生效，可返回活动详情页查看</p>

        <div class="success-actions">
          <button class="ticket-button" @click="router.push(`/events/${paymentForm.eventId}`)">
            🎫 查看电子票
          </button>
          <button class="history-button" @click="goToPaymentHistory">
            查看支付记录
          </button>
          <button class="events-button" @click="router.push('/events')">
            返回活动列表
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.back-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  margin-right: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.page-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.payment-form,
.qrcode-container,
.success-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.form-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

.amount-display {
  font-size: 2.5rem;
  font-weight: bold;
  color: #667eea;
  text-align: center;
  padding: 1rem;
  background: #f8f9ff;
  border-radius: 12px;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-method {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.payment-method.active {
  border-color: #667eea;
  background: #f8f9ff;
}

.payment-method.wallet-method.active {
  border-color: #f59e0b;
  background: #fffbeb;
}

.wallet-method .method-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.payment-method:hover {
  border-color: #667eea;
}

.method-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
}

.method-name {
  font-weight: 600;
  color: #333;
}

.method-desc {
  margin-left: auto;
  font-size: 0.85rem;
  color: #888;
  background: #e3f2fd;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.error-message {
  padding: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.qrcode-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.alipay-logo {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.qrcode-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.amount-large {
  font-size: 3rem;
  font-weight: bold;
  color: #1677ff;
  margin: 0;
}

.qrcode-display {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.qrcode-image {
  width: 260px;
  height: 260px;
  border: 2px solid #eee;
  border-radius: 8px;
  padding: 10px;
  background: white;
  image-rendering: crisp-edges;
}

.scan-hint-text {
  text-align: center;
  margin: 0 0 1.5rem 0;
  color: #1677ff;
  font-weight: 500;
}

.order-info {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.order-title {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #333;
}

.order-id {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #888;
  font-family: monospace;
}

.polling-hint {
  margin: 0;
  color: #1677ff;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.countdown-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 30px;
  margin: 0 auto 1.5rem;
  width: fit-content;
  box-shadow: 0 4px 15px rgba(255, 126, 95, 0.4);
}

.countdown-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.countdown-time {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.processing-container {
  text-align: center;
  padding: 2rem 1.5rem;
}

.processing-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: float 2s ease-in-out infinite;
}

.processing-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
}

.cancel-payment-button {
  padding: 0.875rem 1.5rem;
  background: #fff1f0;
  color: #f5222d;
  border: 2px solid #ffa39e;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-payment-button:hover {
  background: #ffccc7;
  transform: translateY(-2px);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 1.5rem auto;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #1677ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.processing-hint {
  margin: 1.5rem 0 0.5rem 0;
  font-size: 1rem;
  color: #52c41a;
  font-weight: 600;
}

.processing-tip {
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
  color: #fa8c16;
}

.manual-jump-button {
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

.manual-jump-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
}

.processing-order {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed #ddd;
}

.simulate-section {
  border-top: 2px dashed #ddd;
  padding-top: 1.5rem;
  margin-top: 1rem;
  text-align: center;
}

.sandbox-tips {
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: left;
}

.tips-title {
  margin: 0 0 0.75rem 0;
  font-weight: 600;
  color: #1890ff;
}

.tips-list {
  margin: 0;
  padding-left: 1.5rem;
  font-size: 0.85rem;
  color: #333;
  line-height: 1.8;
}

.tips-list code {
  background: #f0f5ff;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  color: #667eea;
}

.simulate-hint {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #666;
}

.simulate-button {
  padding: 0.75rem 1.5rem;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.simulate-button:hover {
  background: #389e0d;
}

.cancel-button {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-button:hover {
  background: #e8e8e8;
}

.success-container {
  text-align: center;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.success-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #52c41a;
}

.success-message {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.success-desc {
  margin: 0 0 2rem 0;
  color: #888;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.ticket-button,
.history-button,
.events-button {
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  font-size: 1rem;
}

.ticket-button {
  background: linear-gradient(135deg, #42b883 0%, #38a169 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
}

.history-button {
  background: #667eea;
  color: white;
}

.events-button {
  background: #f0f0f0;
  color: #333;
}

.history-button:hover,
.events-button:hover {
  transform: translateY(-2px);
}
</style>

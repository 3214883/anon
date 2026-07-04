<template>
  <div class="wallet-page">
    <div class="page-header">
      <h1>💰 我的钱包</h1>
    </div>

    <div class="wallet-card">
      <div class="balance-section">
        <div class="balance-label">账户余额</div>
        <div class="balance-amount">¥ {{ walletBalance.toFixed(2) }}</div>
        <div class="balance-actions">
          <button class="btn btn-primary" @click="showRechargeModal = true">
            📥 充值
          </button>
        </div>
      </div>
    </div>

    <div class="transaction-section">
      <h3>📋 交易记录</h3>
      <div v-if="transactions.length === 0" class="empty-state">
        <span>暂无交易记录</span>
      </div>
      <div v-else class="transaction-list">
        <div
          v-for="tx in transactions"
          :key="tx.id"
          class="transaction-item"
          :class="tx.type"
        >
          <div class="tx-icon">
            <span v-if="tx.type === 'deposit'">💳</span>
            <span v-else-if="tx.type === 'payment'">🛒</span>
            <span v-else-if="tx.type === 'refund'">↩️</span>
            <span v-else-if="tx.type === 'settlement'">💵</span>
            <span v-else-if="tx.type === 'platform_fee'">💎</span>
            <span v-else>🎁</span>
          </div>
          <div class="tx-info">
            <div class="tx-description">{{ tx.description }}</div>
            <div class="tx-time">{{ formatDate(tx.createdAt) }}</div>
          </div>
          <div class="tx-amount" :class="tx.type">
            <span v-if="tx.type === 'deposit' || tx.type === 'system' || tx.type === 'refund' || tx.type === 'settlement' || tx.type === 'platform_fee'">
              +{{ Number(tx.amount).toFixed(2) }}
            </span>
            <span v-else>-{{ Number(tx.amount).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRechargeModal" class="modal-overlay" @click.self="showRechargeModal = false">
      <div class="modal-content recharge-modal">
        <div class="modal-header">
          <h3>💳 钱包充值</h3>
          <button class="close-btn" @click="showRechargeModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="recharge-options">
            <button
              v-for="amount in [10, 50, 100, 200, 500, 1000]"
              :key="amount"
              class="recharge-option"
              :class="{ active: rechargeAmount === amount }"
              @click="rechargeAmount = amount"
            >
              ¥ {{ amount }}
            </button>
          </div>
          <div class="custom-amount">
            <input
              v-model.number="rechargeAmount"
              type="number"
              placeholder="或输入自定义金额"
              min="1"
              max="10000"
            />
          </div>
          <div class="payment-methods">
            <h4>选择支付方式</h4>
            <div class="payment-method-list">
              <button
                class="payment-method alipay"
                :class="{ active: paymentMethod === 'alipay' }"
                @click="handlePayment('alipay')"
              >
                <span class="payment-icon">
                  <svg viewBox="0 0 1024 1024" width="24" height="24">
                    <path fill="#1677FF" d="M962.3 649.2c-17-54.8-43.9-103.8-80.2-146.4 42.7-65.8 68.1-141.9 72.3-224.5H825.3c-3.5 35.1-11.7 69.2-24.3 101.1-33.6-55.8-81.6-100.6-139.2-132.2 19.1-30.8 33.5-64.9 42.7-101.1H546.8c-5.7 22.5-14.4 43.9-26 63.9-124.2-20.8-241.7 8.2-330.8 80.2 32.7-51.3 75.4-95.9 126-131C287 170.1 229.7 134 167 109.9c-62.6-24-129.5-36.5-197.6-36.9v80.6c58.2 0.4 113.9 10.7 165.7 30.7 49.2 19.1 93.9 45.8 131.8 78.8-92.5 43.2-168.4 112-219.8 197.7 16.1-1.7 32.4-2.6 48.8-2.6 70.2 0 137.1 16.1 197.6 46.3-52.2 10.4-98.8 40.3-127.3 82.9h43.9c4.3-16.5 11.7-32 21.6-45.4 57.4 17.3 118.9 26 181.9 26 9.5 0 19-0.2 28.5-0.7-5.5 14.7-12.6 29.2-21.2 43.2 81.6-12.1 157.1-45.4 219.7-96.7-12.1 20.3-25.9 39.5-41.3 57.4 61.8-20.3 118.5-50.2 168.3-88.4zM648.5 356c26-37.6 46.3-80.3 60.1-126.6-70.2 33.7-131.8 83.6-179.6 146.8 50.2-6.9 100.9-12.1 152.3-18.6 7.4-0.8 14.7-1.5 22-2.1h-52l-2.8 0.5z m-247.3 43c-59.7 0-115.5 11.7-165.7 33.7 23.8-32.4 54.1-59.2 89.3-79.6 30-17.3 62.7-30.7 97.1-39.5 24.3 31.1 46.3 64.5 65.7 99.8-28.4-2.9-57.1-4.4-86.4-4.4z m364.5 230c-48.6 36.7-103.3 64.5-162.2 82.5 8-13 15-26.6 20.8-40.7-61.8 8.7-125.7 13.4-190.8 13.4-63.6 0-125.4-4.6-184.6-13.2 15.8 14.7 33.4 28.4 52.8 41 -61 17.7-125 30.2-191.6 36.7v79.7c72 0 142.3-12.6 208.1-36.7 65.8-24.2 124.2-58.3 173.3-100.9 49.2-42.6 88.2-92.6 115.2-148.1-35 34.6-75.5 64.4-121 89.2z"></path>
                  </svg>
                </span>
                <span>支付宝支付</span>
              </button>
              <button
                class="payment-method wechat"
                :class="{ active: paymentMethod === 'wechat' }"
                @click="handlePayment('wechat')"
              >
                <span class="payment-icon">
                  <svg viewBox="0 0 1024 1024" width="24" height="24">
                    <path fill="#07C160" d="M840.32 398.336c-13.312-60.672-54.784-112.64-113.408-146.944-58.624-34.304-127.488-48.64-195.84-40.192-68.352 8.448-131.84 40.192-180.224 89.6-48.384 49.408-79.872 113.408-89.6 182.528-9.728 69.12 4.48 138.24 40.192 196.864 35.712 58.624 88.832 100.096 149.504 118.784l-31.232 58.624c-2.56 4.864-0.512 10.752 4.352 13.312l37.376 19.456c5.376 2.56 11.776 0.512 14.336-4.352l33.792-64.256c35.328 8.448 71.68 12.8 108.032 12.8 36.352 0 72.192-4.352 107.008-12.8l31.744 61.952c2.56 4.864 8.448 7.424 13.824 4.864l39.936-19.456c5.376-2.56 7.424-8.448 4.864-13.824l-27.136-51.2c56.832-20.992 104.96-59.392 139.776-108.544 34.816-49.152 55.808-105.472 60.928-164.352 1.024-12.288 0.512-24.576 0-36.864-1.536-24.064-4.864-47.616-10.24-70.656z"></path>
                  </svg>
                </span>
                <span>微信支付</span>
              </button>
              <button
                class="payment-method test"
                :class="{ active: paymentMethod === 'test' }"
                @click="handlePayment('test')"
              >
                <span class="payment-icon">🧪</span>
                <span>充值测试</span>
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRechargeModal = false">取消</button>
          <button class="btn btn-primary" @click="doRecharge" :disabled="loading || !rechargeAmount || rechargeAmount <= 0 || paymentMethod !== 'test'">
            {{ loading ? '充值中...' : `确认充值 ¥${rechargeAmount || 0}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const formatDate = (date: string | Date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const walletBalance = ref(0)
const transactions = ref<any[]>([])
const loading = ref(false)
const showRechargeModal = ref(false)
const rechargeAmount = ref(100)
const paymentMethod = ref('test')

const handlePayment = (method: string) => {
  if (method !== 'test') {
    alert('🚧 功能开发中，敬请期待')
    return
  }
  paymentMethod.value = method
}

const loadWalletData = async () => {
  try {
    const balanceRes = await api.get('/wallet/balance')
    if (balanceRes.success) {
      walletBalance.value = Number(balanceRes.data.balance) || 0
    }

    const txRes = await api.get('/wallet/transactions')
    if (txRes.success) {
      transactions.value = txRes.data || []
    }
  } catch (error) {
    console.error('加载钱包数据失败:', error)
  }
}

const doRecharge = async () => {
  if (!rechargeAmount.value || rechargeAmount.value <= 0) {
    alert('请输入有效的充值金额')
    return
  }

  loading.value = true
  try {
    const response = await api.post('/wallet/recharge', {
      amount: rechargeAmount.value
    })

    if (response.success) {
      alert(`充值成功！¥${rechargeAmount.value} 已到账`)
      walletBalance.value = Number(response.data.balance)
      showRechargeModal.value = false
      loadWalletData()
    } else {
      alert(`充值失败: ${response.message}`)
    }
  } catch (error: any) {
    alert(`充值失败: ${error.response?.data?.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWalletData()
})
</script>

<style scoped>
.wallet-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.8rem;
  color: #333;
  margin: 0;
}

.wallet-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  color: white;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.balance-section {
  text-align: center;
}

.balance-label {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.balance-amount {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.balance-actions .btn-primary {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.balance-actions .btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.transaction-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.transaction-section h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #f9f9f9;
  transition: background 0.2s ease;
}

.transaction-item:hover {
  background: #f0f0f0;
}

.transaction-item.deposit,
.transaction-item.system,
.transaction-item.refund {
  border-left: 4px solid #52c41a;
}

.transaction-item.payment {
  border-left: 4px solid #ff4d4f;
}

.tx-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  font-size: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tx-info {
  flex: 1;
}

.tx-description {
  font-weight: 500;
  color: #333;
  margin-bottom: 0.25rem;
}

.tx-time {
  font-size: 0.85rem;
  color: #999;
}

.tx-amount {
  font-weight: 600;
  font-size: 1.1rem;
}

.tx-amount.deposit,
.tx-amount.system,
.tx-amount.refund {
  color: #52c41a;
}

.tx-amount.payment {
  color: #ff4d4f;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.recharge-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.recharge-option {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  transition: all 0.2s ease;
}

.recharge-option:hover {
  border-color: #667eea;
}

.recharge-option.active {
  border-color: #667eea;
  background: #f8f9ff;
  color: #667eea;
}

.custom-amount input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

.custom-amount input:focus {
  outline: none;
  border-color: #667eea;
}

.payment-methods {
  margin-top: 1.5rem;
}

.payment-methods h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 0.95rem;
}

.payment-method-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-method {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.payment-method:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.payment-method.active {
  border-color: #667eea;
  background: #f0f3ff;
}

.payment-method.alipay {
  border-color: #e8f4ff;
}

.payment-method.alipay:hover,
.payment-method.alipay.active {
  border-color: #1677FF;
  background: #e8f4ff;
}

.payment-method.wechat {
  border-color: #f0fff4;
}

.payment-method.wechat:hover,
.payment-method.wechat.active {
  border-color: #07C160;
  background: #f0fff4;
}

.payment-method.test {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border: none;
  color: #c76b00;
}

.payment-method.test:hover,
.payment-method.test.active {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(252, 182, 159, 0.4);
}

.payment-icon {
  font-size: 1.2rem;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd6;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

<template>
  <div class="admin-settlement-review page-container">
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">← 返回</button>
        <h1 class="page-title">结算审核管理</h1>
      </div>
      <div class="wallet-card" @click="goToWallet">
        <div class="wallet-icon">💎</div>
        <div class="wallet-info">
          <div class="wallet-label">平台账户余额</div>
          <div class="wallet-balance">¥{{ walletBalance.toFixed(2) }}</div>
        </div>
        <div class="wallet-arrow">→</div>
      </div>
    </div>

    <div class="filter-tabs">
      <button
        class="tab-btn"
        :class="{ active: filterStatus === 'all' }"
        @click="filterStatus = 'all'"
      >
        全部
      </button>
      <button
        class="tab-btn"
        :class="{ active: filterStatus === 'pending' }"
        @click="filterStatus = 'pending'"
      >
        待审核
        <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: filterStatus === 'approved' }"
        @click="filterStatus = 'approved'"
      >
        已通过
      </button>
      <button
        class="tab-btn"
        :class="{ active: filterStatus === 'rejected' }"
        @click="filterStatus = 'rejected'"
      >
        已拒绝
      </button>
    </div>

    <div class="settlement-list">
      <div v-if="filteredSettlements.length === 0" class="empty-state">
        <p>暂无结算申请</p>
      </div>
      <div v-for="s in filteredSettlements" :key="s.id" class="settlement-card">
        <div class="card-header">
          <div class="organizer-info">
            <span class="organizer-name">{{ s.organizerName }}</span>
            <span class="event-name">申请结算：{{ s.eventTitle }}</span>
          </div>
          <span class="settlement-status" :class="s.status">
            {{ getStatusText(s.status) }}
          </span>
        </div>

        <div class="amount-summary">
          <div class="amount-item">
            <span class="label">参与人数</span>
            <span class="value">{{ s.participantCount }} 人</span>
          </div>
          <div class="amount-item">
            <span class="label">总金额</span>
            <span class="value">¥{{ Number(s.totalAmount).toFixed(2) }}</span>
          </div>
          <div class="amount-item">
            <span class="label">平台手续费(5%)</span>
            <span class="value fee">¥{{ Number(s.feeAmount).toFixed(2) }}</span>
          </div>
          <div class="amount-item final">
            <span class="label">结算金额</span>
            <span class="value">¥{{ Number(s.settleAmount).toFixed(2) }}</span>
          </div>
        </div>

        <div class="apply-time">
          申请时间：{{ formatDateTime(s.createdAt) }}
        </div>

        <div v-if="s.status === 'rejected'" class="reject-reason">
          拒绝原因：{{ s.rejectReason }}
        </div>

        <div v-if="s.status === 'pending'" class="review-actions">
          <button class="btn-approve" @click="openApproveModal(s)">
            ✓ 通过
          </button>
          <button class="btn-reject" @click="openRejectModal(s)">
            ✕ 拒绝
          </button>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="modal-overlay" @click.self="closeRejectModal">
      <div class="modal-content">
        <h3>拒绝结算申请</h3>
        <p class="modal-desc">请输入拒绝原因：</p>
        <textarea
          v-model="rejectReason"
          placeholder="请说明拒绝原因..."
          rows="4"
        ></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeRejectModal">取消</button>
          <button class="btn-confirm reject" @click="confirmReject">确认拒绝</button>
        </div>
      </div>
    </div>

    <div v-if="showApproveModal" class="modal-overlay" @click.self="closeApproveModal">
      <div class="modal-content">
        <h3>确认通过结算</h3>
        <p class="modal-desc">
          确认通过后，资金将自动转入主办方钱包<br>
          结算金额：<strong>¥{{ currentSettlement ? Number(currentSettlement.settleAmount).toFixed(2) : '0.00' }}</strong>
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeApproveModal">取消</button>
          <button class="btn-confirm approve" @click="confirmApprove">确认通过</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()

const settlements = ref<any[]>([])
const walletBalance = ref(0)
const filterStatus = ref('pending')
const showRejectModal = ref(false)
const showApproveModal = ref(false)
const currentSettlement = ref<any>(null)
const rejectReason = ref('')

const pendingCount = computed(() =>
  settlements.value.filter(s => s.status === 'pending').length
)

const filteredSettlements = computed(() => {
  if (filterStatus.value === 'all') {
    return settlements.value
  }
  return settlements.value.filter(s => s.status === filterStatus.value)
})

const goBack = () => {
  router.push('/')
}

const goToWallet = () => {
  router.push('/wallet')
}

const loadWalletBalance = async () => {
  try {
    const response = await api.get('/wallet/balance')
    if (response.success) {
      walletBalance.value = Number(response.data.balance) || 0
    }
  } catch (err) {
    console.error('加载钱包余额失败:', err)
  }
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

const loadSettlements = async () => {
  try {
    const response = await api.get('/settlements/all')
    if (response.success) {
      settlements.value = response.data || []
    }
  } catch (err) {
    console.error('加载结算列表失败:', err)
  }
}

const openRejectModal = (settlement: any) => {
  currentSettlement.value = settlement
  rejectReason.value = ''
  showRejectModal.value = true
}

const closeRejectModal = () => {
  showRejectModal.value = false
  currentSettlement.value = null
  rejectReason.value = ''
}

const confirmReject = async () => {
  if (!currentSettlement.value) return
  if (!rejectReason.value.trim()) {
    window.alert('请输入拒绝原因')
    return
  }
  try {
    const response = await api.post(`/settlements/${currentSettlement.value.id}/reject`, {
      reason: rejectReason.value
    })
    if (response.success) {
      window.alert('结算申请已拒绝')
      closeRejectModal()
      loadSettlements()
      loadWalletBalance()
    } else {
      window.alert(response.message || '操作失败')
    }
  } catch (err: any) {
    console.error('拒绝失败:', err)
    window.alert(err.response?.data?.message || '操作失败')
  }
}

const openApproveModal = (settlement: any) => {
  currentSettlement.value = settlement
  showApproveModal.value = true
}

const closeApproveModal = () => {
  showApproveModal.value = false
  currentSettlement.value = null
}

const confirmApprove = async () => {
  if (!currentSettlement.value) return
  try {
    const response = await api.post(`/settlements/${currentSettlement.value.id}/approve`, {})
    if (response.success) {
      window.alert(response.message || '审核通过！资金已转入主办方钱包')
      closeApproveModal()
      loadSettlements()
      loadWalletBalance()
    } else {
      window.alert(response.message || '操作失败')
    }
  } catch (err: any) {
    console.error('审核失败:', err)
    window.alert(err.response?.data?.message || '操作失败')
  }
}

onMounted(() => {
  loadSettlements()
  loadWalletBalance()
})
</script>

<style scoped>
.admin-settlement-review {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.wallet-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.wallet-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.wallet-icon {
  font-size: 28px;
}

.wallet-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wallet-label {
  font-size: 12px;
  opacity: 0.9;
}

.wallet-balance {
  font-size: 20px;
  font-weight: 700;
}

.wallet-arrow {
  font-size: 16px;
  opacity: 0.8;
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

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: #f0f0f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  background: #e0e0e0;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.badge {
  background: #ef4444;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.settlement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settlement-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.organizer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.organizer-name {
  font-size: 16px;
  font-weight: 600;
}

.event-name {
  font-size: 14px;
  color: #666;
}

.settlement-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
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

.amount-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.amount-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.amount-item .label {
  font-size: 13px;
  color: #666;
}

.amount-item .value {
  font-size: 18px;
  font-weight: 600;
}

.amount-item.fee .value {
  color: #f59e0b;
}

.amount-item.final .value {
  color: #10b981;
  font-size: 20px;
}

.apply-time {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
}

.reject-reason {
  padding: 12px 16px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 16px;
}

.review-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-approve,
.btn-reject {
  padding: 10px 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-approve {
  background: #10b981;
  color: #fff;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: #fff;
}

.btn-reject:hover {
  background: #dc2626;
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
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
}

.modal-desc {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.6;
}

.modal-content textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  resize: none;
  outline: none;
  margin-bottom: 20px;
}

.modal-content textarea:focus {
  border-color: #667eea;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-cancel {
  background: #f0f0f0;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-confirm.reject {
  background: #ef4444;
}

.btn-confirm.approve {
  background: #10b981;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #999;
  background: #fff;
  border-radius: 12px;
}
</style>

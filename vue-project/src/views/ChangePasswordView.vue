<template>
  <div class="change-password-page page-container">
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="page-title">🔐 修改密码</h1>
    </div>

    <div class="password-card">
      <div class="card-header">
        <div class="security-icon">🔒</div>
        <p class="card-desc">为了您的账户安全，请先验证当前密码，再设置新密码</p>
      </div>

      <div v-if="errorMessage" class="alert error">
        <span class="alert-icon">⚠️</span>
        <span>{{ errorMessage }}</span>
      </div>

      <div v-if="successMessage" class="alert success">
        <span class="alert-icon">✅</span>
        <span>{{ successMessage }}</span>
      </div>

      <form @submit.prevent="handleChangePassword" class="password-form">
        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">🔑</span>
            当前密码
          </label>
          <div class="input-wrapper">
            <input
              :type="showCurrentPassword ? 'text' : 'password'"
              v-model="form.currentPassword"
              class="form-input"
              placeholder="请输入当前密码"
              :class="{ error: errors.currentPassword }"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showCurrentPassword = !showCurrentPassword"
            >
              {{ showCurrentPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <p v-if="errors.currentPassword" class="error-text">{{ errors.currentPassword }}</p>
        </div>

        <div class="divider-line"></div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">✨</span>
            新密码
          </label>
          <div class="input-wrapper">
            <input
              :type="showNewPassword ? 'text' : 'password'"
              v-model="form.newPassword"
              class="form-input"
              placeholder="请设置6-20位新密码"
              :class="{ error: errors.newPassword }"
              @input="checkPasswordStrength"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showNewPassword = !showNewPassword"
            >
              {{ showNewPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <div v-if="form.newPassword" class="password-strength">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :class="strengthLevel.class"
                :style="{ width: strengthLevel.width }"
              ></div>
            </div>
            <span class="strength-text">{{ strengthLevel.text }}</span>
          </div>
          <p v-if="errors.newPassword" class="error-text">{{ errors.newPassword }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">
            <span class="label-icon">✅</span>
            确认新密码
          </label>
          <div class="input-wrapper">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="form.confirmPassword"
              class="form-input"
              placeholder="请再次输入新密码"
              :class="{ error: errors.confirmPassword }"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
          <p v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</p>
        </div>

        <div class="form-tips">
          <div class="tip-item" :class="{ pass: hasLength }">
            <span class="tip-icon">{{ hasLength ? '✓' : '○' }}</span>
            <span>6-20位字符</span>
          </div>
          <div class="tip-item" :class="{ pass: hasLetter }">
            <span class="tip-icon">{{ hasLetter ? '✓' : '○' }}</span>
            <span>包含字母</span>
          </div>
          <div class="tip-item" :class="{ pass: hasNumber }">
            <span class="tip-icon">{{ hasNumber ? '✓' : '○' }}</span>
            <span>包含数字</span>
          </div>
          <div class="tip-item" :class="{ pass: passwordsMatch }">
            <span class="tip-icon">{{ passwordsMatch ? '✓' : '○' }}</span>
            <span>两次密码一致</span>
          </div>
        </div>

        <button
          type="submit"
          class="submit-btn"
          :disabled="loading || !canSubmit"
        >
          {{ loading ? '处理中...' : '确认修改密码' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const hasLength = computed(() => form.value.newPassword.length >= 6 && form.value.newPassword.length <= 20)
const hasLetter = computed(() => /[a-zA-Z]/.test(form.value.newPassword))
const hasNumber = computed(() => /[0-9]/.test(form.value.newPassword))
const passwordsMatch = computed(() => form.value.newPassword && form.value.newPassword === form.value.confirmPassword)
const canSubmit = computed(() => hasLength.value && passwordsMatch.value && form.value.currentPassword)

const strengthLevel = computed(() => {
  let score = 0
  if (hasLength.value) score++
  if (hasLetter.value) score++
  if (hasNumber.value) score++
  if (form.value.newPassword.length >= 10) score++

  if (score <= 1) return { class: 'weak', width: '25%', text: '密码强度：弱' }
  if (score === 2) return { class: 'medium', width: '50%', text: '密码强度：一般' }
  if (score === 3) return { class: 'strong', width: '75%', text: '密码强度：良好' }
  return { class: 'excellent', width: '100%', text: '密码强度：非常好' }
})

const goBack = () => {
  router.push('/profile')
}

const checkPasswordStrength = () => {
}

const validateForm = (): boolean => {
  errors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  errorMessage.value = ''

  if (!form.value.currentPassword) {
    errors.value.currentPassword = '请输入当前密码'
    return false
  }

  if (!form.value.newPassword) {
    errors.value.newPassword = '请输入新密码'
    return false
  }

  if (form.value.newPassword.length < 6) {
    errors.value.newPassword = '密码至少6位字符'
    return false
  }

  if (form.value.newPassword.length > 20) {
    errors.value.newPassword = '密码不能超过20位字符'
    return false
  }

  if (form.value.newPassword !== form.value.confirmPassword) {
    errors.value.confirmPassword = '两次输入的密码不一致'
    return false
  }

  return true
}

const handleChangePassword = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const response = await api.post('/users/change-password', {
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword
    })

    if (response.success) {
      successMessage.value = '密码修改成功！正在跳转到个人中心...'
      setTimeout(() => {
        router.push('/profile')
      }, 2000)
    } else {
      errorMessage.value = response.message || '密码修改失败，请重试'
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || '当前密码不正确，请重新输入'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const userData = localStorage.getItem('user')
  if (!userData) {
    router.push('/login')
  }
})
</script>

<style scoped>
.change-password-page {
  max-width: 500px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  min-height: 100vh;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
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
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.password-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.security-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.card-desc {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.alert.error {
  background: #fff2f2;
  color: #d93025;
  border: 1px solid #ffdede;
}

.alert.success {
  background: #f0fff4;
  color: #2e7d32;
  border: 1px solid #c8f0d6;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 14px 48px 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #667eea;
}

.form-input.error {
  border-color: #d93025;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 3px;
  transition: all 0.3s;
}

.strength-fill.weak {
  background: #ff4d4f;
}

.strength-fill.medium {
  background: #faad14;
}

.strength-fill.strong {
  background: #52c41a;
}

.strength-fill.excellent {
  background: #13c2c2;
}

.strength-text {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.error-text {
  font-size: 12px;
  color: #d93025;
  margin: 0;
}

.divider-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e8e8e8, transparent);
  margin: 8px 0;
}

.form-tips {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
}

.tip-item.pass {
  color: #52c41a;
}

.tip-icon {
  font-size: 12px;
  font-weight: 700;
}

.submit-btn {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

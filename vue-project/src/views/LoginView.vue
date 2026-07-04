<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index'
import { tokenManager } from '../utils/tokenManager'

const router = useRouter()

const isLogin = ref(true)
const loading = ref(false)
const error = ref('')

const formData = reactive({
  email: '',
  password: '',
  name: ''
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
  formData.email = ''
  formData.password = ''
  formData.name = ''
}

const validateForm = () => {
  if (!formData.email) {
    error.value = '请输入邮箱'
    return false
  }
  if (!formData.password) {
    error.value = '请输入密码'
    return false
  }
  if (!isLogin.value && !formData.name) {
    error.value = '请输入用户名'
    return false
  }
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''

  try {
    if (isLogin.value) {
      console.log('Email login request:', formData)
      const response = await api.post('/users/login', {
        email: formData.email,
        password: formData.password
      })
      console.log('Email login response:', response)

      if (response && response.success && response.data && response.data.accessToken) {
        tokenManager.saveTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn
        });
        localStorage.setItem('user', JSON.stringify(response.data))
        window.dispatchEvent(new CustomEvent('userLoggedIn'))
        router.push('/')
      } else {
        error.value = '邮箱或密码错误'
      }
    } else {
      console.log('Register request:', formData)
      const response = await api.post('/users/register', {
        username: formData.name,
        email: formData.email,
        phone: '',
        password: formData.password
      })
      console.log('Register response:', response)

      if (response && response.success && response.data && response.data.accessToken) {
        tokenManager.saveTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresIn: response.data.expiresIn
        });
        localStorage.setItem('user', JSON.stringify(response.data))
        window.dispatchEvent(new CustomEvent('userLoggedIn'))
        router.push('/')
      } else {
        error.value = '注册失败，请重试'
      }
    }
  } catch (err: any) {
    console.error('Login/Register error:', err)
    const errorMsg = err.response?.data?.message || '网络错误，请检查连接'
    error.value = errorMsg

    if (errorMsg.includes('已被禁用')) {
      window.alert('❌ ' + errorMsg)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="app-name">易伴</h1>
      <p class="welcome-text">发现精彩活动，连接志同道合的人</p>
      <div class="logo">🎉</div>
      <h1 class="title">{{ isLogin ? '登录' : '注册' }}</h1>

      <div class="form">
        <!-- 注册表单 -->
        <div v-if="!isLogin">
          <div class="form-group">
            <label for="name">用户名</label>
            <input
              type="text"
              id="name"
              v-model="formData.name"
              placeholder="请输入用户名"
            />
          </div>

          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              placeholder="请输入邮箱"
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              type="password"
              id="password"
              v-model="formData.password"
              placeholder="请输入密码"
            />
          </div>
        </div>

        <!-- 登录表单 -->
        <div v-else>
          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              type="email"
              id="email"
              v-model="formData.email"
              placeholder="请输入邮箱"
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              type="password"
              id="password"
              v-model="formData.password"
              placeholder="请输入密码"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button
          class="btn btn-primary"
          @click="handleSubmit"
          :disabled="loading"
        >
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </div>

      <div class="toggle-mode">
        {{ isLogin ? '还没有账号？' : '已有账号？' }}
        <button class="link-btn" @click="toggleMode">
          {{ isLogin ? '立即注册' : '立即登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 50%, #d9dfe6 100%);
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background:
    radial-gradient(circle at 20% 80%, rgba(66, 184, 131, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(52, 152, 219, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(155, 89, 182, 0.08) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(30px, -30px) rotate(5deg); }
}

.login-container {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 24px;
  padding: 3rem;
  max-width: 440px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1;
}

.app-name {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #42b883 0%, #3498db 50%, #9b59b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.welcome-text {
  color: rgba(0, 0, 0, 0.5);
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.logo {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 8px 24px rgba(66, 184, 131, 0.2));
}

.title {
  color: #1a1a2e;
  font-size: 1.85rem;
  margin-bottom: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
  text-align: left;
}

label {
  display: block;
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.875rem;
  margin-bottom: 0.6rem;
  font-weight: 600;
  text-align: left;
}

input {
  width: 100%;
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  color: #1a1a2e;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

input:hover {
  border-color: rgba(66, 184, 131, 0.3);
  background: #fff;
}

input:focus {
  outline: none;
  border-color: rgba(66, 184, 131, 0.6);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(66, 184, 131, 0.1), 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.error-message {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 12px;
  color: #e74c3c;
  padding: 0.875rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message::before {
  content: '⚠️';
}

.btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.02em;
}

.btn-primary {
  background: linear-gradient(135deg, #42b883 0%, #3498db 50%, #9b59b6 100%);
  background-size: 200% 200%;
  color: white;
  box-shadow: 0 6px 24px rgba(66, 184, 131, 0.3);
  animation: gradientShift 8s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 40px rgba(66, 184, 131, 0.5);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(66, 184, 131, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  animation: none;
}

.toggle-mode {
  color: rgba(0, 0, 0, 0.5);
  font-size: 0.9rem;
  padding: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 0.5rem;
}

.link-btn {
  background: none;
  border: none;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: 0.25rem;
  transition: all 0.3s ease;
  position: relative;
}

.link-btn::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  transition: width 0.3s ease;
}

.link-btn:hover::after {
  width: 100%;
}

@media (max-width: 480px) {
  .login-page {
    padding: 1rem;
    background: #ffffff;
  }

  .login-container {
    padding: 2rem 1.5rem;
    box-shadow: none;
    border: none;
  }

  .app-name {
    font-size: 2rem;
  }

  .title {
    font-size: 1.5rem;
  }
}
</style>

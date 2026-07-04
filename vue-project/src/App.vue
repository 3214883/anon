<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { tokenManager } from './utils/tokenManager'
import api from './api'

const { locale, t } = useI18n()
const router = useRouter()

interface User {
  id: number
  username: string
  email: string
  role: string
  token?: string
}

const languages = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' }
]

const user = ref<User | null>(null)

const loadUser = async () => {
  const accessToken = tokenManager.getAccessToken()

  if (accessToken) {
    try {
      console.log('🔄 从后端获取最新用户信息...')
      const response = await api.get('/users/me')
      if (response.success && response.data) {
        console.log('✅ 获取到最新用户信息:', response.data.username)
        user.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        return
      }
    } catch (err) {
      console.warn('⚠️ 从后端获取用户信息失败，使用本地缓存:', err)
    }
  }

  const userData = localStorage.getItem('user')
  if (userData) {
    user.value = JSON.parse(userData)
  }
}

onMounted(() => {
  // 迁移旧的token格式
  tokenManager.migrateOldToken();

  loadUser()
  checkLocalStorage()

  // 监听用户登录事件
  window.addEventListener('userLoggedIn', () => {
    loadUser()
    checkLocalStorage()
  })

  // 监听用户登出事件
  window.addEventListener('userLoggedOut', () => {
    user.value = null
    checkLocalStorage()
  })
})

const changeLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

const goToLogin = () => {
  router.push('/login')
}

const logout = () => {
  tokenManager.clearTokens()
  localStorage.removeItem('user')
  user.value = null
  // 触发登出成功事件，通知其他组件更新状态
  window.dispatchEvent(new CustomEvent('userLoggedOut'))
  router.push('/')
}

const checkLocalStorage = () => {
  console.log('LocalStorage user:', localStorage.getItem('user'))
  console.log('Access token:', tokenManager.getAccessToken() ? 'exists' : 'not found')
  console.log('Token expired:', tokenManager.isTokenExpired())
  console.log('Token near expiry:', tokenManager.isTokenNearExpiry())
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="container">
        <h1>易伴</h1>
        <nav class="nav">
          <ul>
            <li><router-link :to="'/'">{{ $t('home') }}</router-link></li>
            <li><router-link :to="'/events'">{{ $t('events') }}</router-link></li>
            <li v-if="user && user.role !== 'admin'"><router-link :to="'/create-event'">{{ $t('createEvent') }}</router-link></li>
            <li v-if="user && user.role !== 'admin'"><router-link :to="'/profile'">{{ $t('profile') }}</router-link></li>
            <li v-if="user && user.role === 'admin'">
              <router-link :to="'/user-management'">{{ $t('userManagement') }}</router-link>
            </li>
            <li v-if="user && user.role === 'admin'">
              <router-link :to="'/event-management'">{{ $t('eventManagement') }}</router-link>
            </li>
            <li v-if="user && user.role === 'admin'">
              <router-link :to="'/admin-settlement-review'">结算审核</router-link>
            </li>
            <li v-if="!user">
              <button class="btn-login" @click="goToLogin">{{ $t('login') }}</button>
            </li>
            <li v-else>
              <div class="user-menu">
                <span class="user-name">{{ user.username }}</span>
                <button class="btn-logout" @click="logout">{{ $t('logout') }}</button>
              </div>
            </li>
          </ul>
        </nav>
        <div class="language-selector">
          <select v-model="locale" @change="changeLanguage(locale)">
            <option v-for="lang in languages" :key="lang.value" :value="lang.value">
              {{ lang.label }}
            </option>
          </select>
        </div>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: rgba(15, 15, 35, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 1rem 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.container h1 {
  background: linear-gradient(135deg, #42b883 0%, #3498db 50%, #9b59b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.nav ul {
  display: flex;
  list-style: none;
  gap: 2rem;
  align-items: center;
}

.nav a {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 0.9375rem;
  position: relative;
  padding: 0.5rem 0;
}

.nav a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  transition: width 0.3s ease;
  border-radius: 1px;
}

.nav a:hover {
  color: #ffffff;
}

.nav a:hover::after {
  width: 100%;
}

.nav a.router-link-active {
  color: #42b883;
}

.nav a.router-link-active::after {
  width: 100%;
}

.language-selector select {
  padding: 0.625rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 0.875rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M8 12l-4-4h8l-4 4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px 12px;
  padding-right: 2.5rem;
}

.language-selector select:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.language-selector select option {
  background: #1a1a2e;
  color: white;
  border: none;
}

.btn-login {
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  color: white;
  border: none;
  padding: 0.625rem 1.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(66, 184, 131, 0.3);
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 184, 131, 0.5);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-logout {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.625rem 1.25rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  background: rgba(231, 76, 60, 0.1);
  border-color: rgba(231, 76, 60, 0.3);
  color: #e74c3c;
  transform: translateY(-2px);
}

.main {
  flex: 1;
  padding: 0;
}
</style>

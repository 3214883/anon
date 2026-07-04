<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../api'

const { t, locale } = useI18n()
const router = useRouter()

interface UserProfile {
  name: string
  email: string
  bio: string
  location: string
  website: string
  phone: string
  contact: string
  avatar: string
  coverImage: string
}

const profile = ref<UserProfile>({
  name: '',
  email: '',
  bio: '',
  location: '',
  website: '',
  phone: '',
  contact: '',
  avatar: '',
  coverImage: ''
})

const isSaving = ref(false)
const showAlert = ref(false)
const alertMessage = ref('')

// 加载用户信息
onMounted(async () => {
  const userData = localStorage.getItem('user')
  if (!userData) {
    router.push('/login')
    return
  }
  await loadUserInfo()
})

const loadUserInfo = async () => {
  try {
    const response = await api.get('/users/me')
    console.log('EditProfile加载用户信息:', response.data)
    if (response.success && response.data) {
      const user = response.data
      profile.value = {
        ...profile.value,
        name: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        contact: user.contact || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || '',
        coverImage: user.coverImage || ''
      }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    // 如果API调用失败，从localStorage获取
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      profile.value = {
        ...profile.value,
        name: user.username || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        contact: user.contact || '',
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar || '',
        coverImage: user.coverImage || ''
      }
    }
  }
}

const handleAvatarUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    console.log('上传头像:', input.files[0])
    // 转成base64永久保存
    const reader = new FileReader()
    reader.onload = (e) => {
      profile.value.avatar = e.target?.result as string
    }
    reader.readAsDataURL(input.files[0])
  }
}

const handleCoverUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    console.log('上传封面:', input.files[0])
    // 转成base64永久保存
    const reader = new FileReader()
    reader.onload = (e) => {
      profile.value.coverImage = e.target?.result as string
    }
    reader.readAsDataURL(input.files[0])
  }
}

const showCustomAlert = (message: string) => {
  alertMessage.value = message
  showAlert.value = true
}

const closeAlert = () => {
  showAlert.value = false
}

const saveProfile = async () => {
  isSaving.value = true

  try {
    console.log('🔴 保存前 profile.value.coverImage 长度:', profile.value.coverImage ? profile.value.coverImage.length : '空')
    console.log('准备保存用户信息，提交的数据:', {
      username: profile.value.name,
      avatar: profile.value.avatar,
      coverImage: profile.value.coverImage ? profile.value.coverImage.substring(0, 50) + '...' : '空',
      bio: profile.value.bio,
      location: profile.value.location,
      phone: profile.value.phone,
      contact: profile.value.contact
    })

    // 调用后端API保存用户信息
    const response = await api.put('/users/me', {
      username: profile.value.name,
      avatar: profile.value.avatar,
      coverImage: profile.value.coverImage,
      bio: profile.value.bio,
      location: profile.value.location,
      phone: profile.value.phone,
      contact: profile.value.contact
    })

    console.log('🔴 后端API响应:', response)
    console.log('🔴 响应返回的coverImage:', response.data ? response.data.coverImage ? '有数据' : '空' : '无data字段')

    if (response.success && response.data) {
      console.log('保存成功，后端返回的用户数据:', response.data)
      // 使用后端返回的用户信息更新本地存储
      localStorage.setItem('user', JSON.stringify(response.data))

      isSaving.value = false
      showCustomAlert(t('profileSaved'))
      // 触发个人资料更新事件
      window.dispatchEvent(new CustomEvent('profileUpdated'))
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } else {
      isSaving.value = false
      showCustomAlert(t('saveFailed'))
    }
  } catch (error) {
    console.error('保存用户信息失败:', error)
    isSaving.value = false
    showCustomAlert(t('saveFailed'))
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}

const logout = () => {
  localStorage.removeItem('user')
  window.dispatchEvent(new CustomEvent('userLoggedOut'))
  router.push('/login')
}
</script>

<template>
  <div class="edit-profile-page">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <div class="container">
        <div class="nav-left">
          <a href="/" class="logo">{{ $t('appName') }}</a>
          <div class="nav-links">
            <a href="/" class="nav-link">{{ $t('home') }}</a>
            <a href="/events" class="nav-link">{{ $t('events') }}</a>
          </div>
        </div>
        <div class="nav-right">
          <div class="user-menu">
            <span class="user-name">{{ profile.name }}</span>
            <button class="logout-button" @click="logout">退出登录</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <button class="back-button" @click="goBack">
            &lt; {{ $t('back') }}
          </button>
          <h1 class="page-title">{{ $t('editProfile') }}</h1>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <div class="container">
        <div class="content-wrapper">
          <!-- 左侧导航 -->
          <div class="sidebar">
            <h3 class="sidebar-title">功能导航</h3>
            <div class="menu-section">
              <div class="menu-item" @click="router.push('/profile')">
                <div class="menu-icon">👤</div>
                <div class="menu-title">个人资料</div>
              </div>
              <div class="menu-item active" @click="router.push('/edit-profile')">
                <div class="menu-icon">✏️</div>
                <div class="menu-title">修改资料</div>
              </div>
              <div class="menu-item" @click="router.push('/change-password')">
                <div class="menu-icon">🔒</div>
                <div class="menu-title">修改密码</div>
              </div>
              <div class="menu-item" @click="router.push('/settings')">
                <div class="menu-icon">⚙️</div>
                <div class="menu-title">设置</div>
              </div>
            </div>
          </div>

          <!-- 右侧内容 -->
          <div class="profile-content">
            <div class="form-card">
              <!-- 基本情报 -->
              <div class="form-section">
                <h2 class="section-title">{{ $t('basicInfo') }}</h2>

                <div class="info-item avatar-item">
                  <div class="info-label">
                    <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.name" class="avatar" />
                    <div v-else class="avatar-placeholder">
                      {{ profile.name.charAt(0) || '?' }}
                    </div>
                  </div>
                  <div class="info-value">
                    <span class="username">{{ profile.name || '用户名' }}</span>
                    <label class="edit-link">
                      {{ $t('edit') }}
                      <input type="file" accept="image/*" @change="handleAvatarUpload" class="file-input" />
                    </label>
                  </div>
                </div>
              </div>

              <!-- 配送先住所 -->
              <div class="form-section">
                <h3 class="section-subtitle">{{ $t('deliveryAddress') }}</h3>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">{{ $t('name') }}</label>
                    <input type="text" v-model="profile.name" :placeholder="$t('name')" class="form-input" />
                  </div>

                  <div class="form-group">
                    <label class="form-label">{{ $t('phone') }}</label>
                    <input type="tel" v-model="profile.phone" :placeholder="$t('phone')" class="form-input" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">{{ $t('contact') }}</label>
                  <input type="text" v-model="profile.contact" :placeholder="$t('contact')" class="form-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">{{ $t('location') }}</label>
                  <input type="text" v-model="profile.location" :placeholder="$t('locationPlaceholder')" class="form-input" />
                </div>

                <div class="form-group">
                  <label class="form-label">{{ $t('bio') }}</label>
                  <textarea v-model="profile.bio" rows="4" :placeholder="$t('bioPlaceholder')" class="form-input"></textarea>
                </div>
              </div>

              <!-- カバー画像 -->
              <div class="form-section">
                <h3 class="section-subtitle">{{ $t('coverImage') }}</h3>
                <p class="section-description">{{ $t('clickToUpload') }}</p>

                <label class="cover-upload-area">
                  <img v-if="profile.coverImage" :src="profile.coverImage" :alt="'Cover'" class="cover-image" />
                  <div v-else class="cover-placeholder">
                    <div class="plus-icon">+</div>
                  </div>
                  <input type="file" accept="image/*" @change="handleCoverUpload" class="file-input" />
                </label>
              </div>

              <!-- 保存按钮 -->
              <div class="form-actions">
                <button class="btn btn-secondary" @click="goBack">{{ $t('cancel') }}</button>
                <button class="btn btn-primary" @click="saveProfile" :disabled="isSaving">
                  {{ isSaving ? $t('saving') : $t('save') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义弹窗 -->
    <transition name="fade">
      <div v-if="showAlert" class="alert-overlay" @click.self="closeAlert">
        <div class="alert-box">
          <div class="alert-icon">⚠️</div>
          <div class="alert-message">{{ alertMessage }}</div>
          <button class="alert-button" @click="closeAlert">确定</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.edit-profile-page {
  min-height: 100vh;
  background: #f5f7fa;
  color: #333;
}

/* 顶部导航 */
.top-nav {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #42b883;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #42b883;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.logout-button {
  padding: 0.5rem 1rem;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  color: #c62828;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: #ffcdd2;
  border-color: #ef5350;
  transform: translateY(-2px);
}

/* 页面标题 */
.page-header {
  background: white;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
}

.back-button:hover {
  color: #42b883;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

/* 主要内容 */
.main-content {
  padding-bottom: 4rem;
}

.form-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

/* 表单部分 */
.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #333;
}

.section-subtitle {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
  color: #666;
}

.section-description {
  font-size: 0.875rem;
  color: #999;
  margin: 0 0 1.5rem 0;
}

/* 表单行 */
.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* 表单组 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  color: #333;
  outline: none;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

/* 信息项 */
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.875rem;
  color: #666;
}

.info-value {
  font-size: 0.875rem;
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 2rem;
}

/* 头像项 */
.avatar-item {
  align-items: flex-start;
  padding: 1rem 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #42b883;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  border: 2px solid #42b883;
}

.username {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
}

.edit-link {
  font-size: 0.875rem;
  color: #42b883;
  cursor: pointer;
  display: inline-block;
  padding: 0.5rem 1rem;
  border: 1px solid #42b883;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.edit-link:hover {
  background: #42b883;
  color: white;
}

.file-input {
  display: none;
}

/* 封面上传 */
.cover-upload-area {
  position: relative;
  width: 100%;
  height: 200px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.cover-upload-area:hover {
  border-color: #42b883;
  background: #f9f9f9;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.plus-icon {
  font-size: 3rem;
  color: #ccc;
  transition: color 0.3s ease;
}

.cover-upload-area:hover .plus-icon {
  color: #42b883;
}

/* 复选框 */
.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #666;
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* 表单操作 */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #38a169;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(66, 184, 131, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 自定义弹窗样式 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.alert-box {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 320px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.alert-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.alert-message {
  font-size: 0.9375rem;
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.alert-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #42b883;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.alert-button:hover {
  background: #38a169;
}

/* 内容包装器 */
.content-wrapper {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

/* 左侧导航 */
.sidebar {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 250px;
  flex-shrink: 0;
  position: sticky;
  top: 100px;
  height: fit-content;
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333;
  text-decoration: none;
}

.menu-item:hover {
  background: #f5f7fa;
  transform: translateX(5px);
}

.menu-item.active {
  background: #42b883;
  color: white;
}

.menu-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.menu-title {
  font-weight: 500;
}

/* 右侧内容 */
.profile-content {
  flex: 1;
  min-width: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-left {
    gap: 1rem;
  }

  .nav-links {
    display: none;
  }

  .content-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    position: static;
  }

  .menu-section {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .menu-item {
    flex-shrink: 0;
    min-width: 120px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>

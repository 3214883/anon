<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const organizations = ref<any[]>([])
const loading = ref(false)
const error = ref('')

interface Organization {
  id: number
  name: string
  description: string
  logo?: string
  members: number
  foundedDate: string
}

onMounted(() => {
  loadOrganizations()
})

const loadOrganizations = async () => {
  loading.value = true
  error.value = ''
  try {
    // 模拟组织数据
    // 实际项目中，这里应该从API获取组织数据
    organizations.value = [
      {
        id: 1,
        name: '技术爱好者协会',
        description: '致力于技术交流和分享的组织',
        members: 120,
        foundedDate: '2023-01-01'
      },
      {
        id: 2,
        name: '户外运动俱乐部',
        description: '组织各种户外活动，如徒步、露营等',
        members: 85,
        foundedDate: '2022-06-15'
      }
    ]
  } catch (err: any) {
    error.value = err.message || '加载组织失败'
    console.error('Error loading organizations:', err)
  } finally {
    loading.value = false
  }
}

const goToOrganizationDetail = (orgId: number) => {
  // 跳转到组织详情页面
  router.push(`/organization/${orgId}`)
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}
</script>

<template>
  <div class="organizations-page">
    <!-- 顶部导航 -->
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">{{ t('organizations') }}</h1>
      <div class="header-actions"></div>
    </div>

    <div class="page-container">
      <!-- 组织列表 -->
      <div v-if="loading" class="loading">
        {{ t('loading') }}
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else-if="organizations.length === 0" class="no-organizations">
        {{ t('noOrganizations') }}
      </div>
      <div v-else class="organizations-list">
        <div
          v-for="org in organizations"
          :key="org.id"
          class="organization-card"
          @click="goToOrganizationDetail(org.id)"
        >
          <div class="organization-logo" v-if="org.logo">
            <img :src="org.logo" :alt="org.name" />
          </div>
          <div class="organization-logo placeholder" v-else>
            <div class="placeholder-content">
              <span class="icon">🏢</span>
            </div>
          </div>
          <div class="organization-info">
            <h3 class="organization-name">{{ org.name }}</h3>
            <p class="organization-description">{{ org.description }}</p>
            <div class="organization-details">
              <span class="detail-item">
                <i class="icon">👥</i>
                {{ org.members }} 成员
              </span>
              <span class="detail-item">
                <i class="icon">📅</i>
                {{ org.foundedDate }}
              </span>
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
.organizations-page {
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
.no-organizations {
  text-align: center;
  padding: 4rem 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.125rem;
}

.error {
  color: #e74c3c;
}

/* 组织列表 */
.organizations-list {
  margin-top: 1rem;
}

.organization-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.organization-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.organization-logo {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.organization-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.organization-logo.placeholder {
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  text-align: center;
}

.placeholder-content .icon {
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.3);
}

.organization-info {
  flex: 1;
  min-width: 0;
}

.organization-name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.organization-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.organization-details {
  display: flex;
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.detail-item .icon {
  font-size: 0.875rem;
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
  .organizations-page {
    padding-bottom: 60px;
  }

  .header {
    padding: 0.75rem;
  }

  .organization-card {
    padding: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .organization-logo {
    width: 50px;
    height: 50px;
  }

  .organization-name {
    font-size: 1rem;
  }

  .organization-description {
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

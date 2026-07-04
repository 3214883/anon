<template>
  <div class="settings-page page-container">
    <div class="page-header">
      <button class="back-btn" @click="goBack">← 返回</button>
      <h1 class="page-title">⚙️ 账号设置</h1>
    </div>

    <div class="settings-card">
      <div class="setting-section">
        <h3 class="section-title">🔐 安全设置</h3>
        <div class="setting-list">
          <div class="setting-item" @click="router.push('/change-password')">
            <div class="setting-left">
              <div class="item-icon">🔑</div>
              <div class="item-info">
                <div class="item-title">修改密码</div>
                <div class="item-desc">定期更换密码保护账号安全</div>
              </div>
            </div>
            <div class="setting-arrow">›</div>
          </div>
        </div>
      </div>

      <div class="setting-section">
        <h3 class="section-title">🔔 通知设置</h3>
        <div class="setting-list">
          <div class="setting-item toggle">
            <div class="setting-left">
              <div class="item-icon">📧</div>
              <div class="item-info">
                <div class="item-title">邮件通知</div>
                <div class="item-desc">接收活动相关邮件提醒</div>
              </div>
            </div>
            <div class="toggle-switch" :class="{ active: notificationSettings.email }" @click="notificationSettings.email = !notificationSettings.email">
              <div class="toggle-handle"></div>
            </div>
          </div>
          <div class="setting-item toggle">
            <div class="setting-left">
              <div class="item-icon">📱</div>
              <div class="item-info">
                <div class="item-title">推送通知</div>
                <div class="item-desc">接收活动动态实时推送</div>
              </div>
            </div>
            <div class="toggle-switch" :class="{ active: notificationSettings.push }" @click="notificationSettings.push = !notificationSettings.push">
              <div class="toggle-handle"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-section">
        <h3 class="section-title">🌐 通用设置</h3>
        <div class="setting-list">
          <div class="setting-item toggle">
            <div class="setting-left">
              <div class="item-icon">🔒</div>
              <div class="item-info">
                <div class="item-title">隐私模式</div>
                <div class="item-desc">隐藏个人活动和关注列表</div>
              </div>
            </div>
            <div class="toggle-switch" :class="{ active: accountSettings.privacyMode }" @click="accountSettings.privacyMode = !accountSettings.privacyMode">
              <div class="toggle-handle"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-section">
        <h3 class="section-title">⚠️ 危险操作</h3>
        <div class="setting-list">
          <div class="setting-item danger" @click="handleLogout">
            <div class="setting-left">
              <div class="item-icon">🚪</div>
              <div class="item-info">
                <div class="item-title">退出登录</div>
                <div class="item-desc">退出当前账号</div>
              </div>
            </div>
            <div class="setting-arrow">›</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const notificationSettings = ref({
  email: true,
  push: true
})

const accountSettings = ref({
  privacyMode: false
})

const goBack = () => {
  router.push('/profile')
}

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.dispatchEvent(new CustomEvent('userLoggedOut'))
    router.push('/login')
  }
}

onMounted(() => {
  const savedNotificationSettings = localStorage.getItem('notificationSettings')
  if (savedNotificationSettings) {
    notificationSettings.value = JSON.parse(savedNotificationSettings)
  }

  const savedAccountSettings = localStorage.getItem('accountSettings')
  if (savedAccountSettings) {
    accountSettings.value = JSON.parse(savedAccountSettings)
  }
})
</script>

<style scoped>
.settings-page {
  max-width: 600px;
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

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 8px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.setting-section {
  padding: 16px 0;
  border-bottom: 8px solid #f5f5f5;
}

.setting-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin: 0 24px 12px;
}

.setting-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  cursor: pointer;
  transition: background 0.2s;
}

.setting-item:hover {
  background: #f8f9fa;
}

.setting-item.danger:hover {
  background: #fff2f2;
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
}

.setting-item.danger .item-icon {
  background: #fff2f2;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.setting-item.danger .item-title {
  color: #d93025;
}

.item-desc {
  font-size: 13px;
  color: #999;
}

.setting-arrow {
  font-size: 20px;
  color: #ccc;
  font-weight: 500;
}

.toggle-switch {
  width: 48px;
  height: 28px;
  background: #e8e8e8;
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch.active {
  background: #667eea;
}

.toggle-handle {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.toggle-switch.active .toggle-handle {
  transform: translateX(20px);
}
</style>

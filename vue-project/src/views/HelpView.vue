<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const faqs = ref([
  {
    id: 1,
    question: '如何创建活动？',
    answer: '点击底部导航栏的“+”按钮，进入创建活动页面，填写活动信息并提交即可。'
  },
  {
    id: 2,
    question: '如何报名活动？',
    answer: '在活动详情页面，点击“立即报名”按钮，填写报名信息并提交即可。'
  },
  {
    id: 3,
    question: '如何查看我的活动？',
    answer: '在个人资料页面，点击“我创建的”或“我参加的”按钮，即可查看对应活动列表。'
  },
  {
    id: 4,
    question: '如何修改个人信息？',
    answer: '在个人资料页面，点击“编辑”按钮，修改个人信息并保存即可。'
  },
  {
    id: 5,
    question: '如何联系客服？',
    answer: '您可以通过电子邮件 support@example.com 或电话 400-123-4567 联系我们的客服团队。'
  }
])

const selectedFaq = ref<number | null>(null)

const toggleFaq = (faqId: number) => {
  selectedFaq.value = selectedFaq.value === faqId ? null : faqId
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
  <div class="help-page">
    <!-- 顶部导航 -->
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">{{ t('help') }}</h1>
      <div class="header-actions"></div>
    </div>

    <div class="page-container">
      <!-- 常见问题 -->
      <div class="help-section">
        <h2 class="section-title">{{ t('faq') }}</h2>
        <div class="faq-list">
          <div
            v-for="faq in faqs"
            :key="faq.id"
            class="faq-item"
            @click="toggleFaq(faq.id)"
          >
            <div class="faq-question">
              <span class="question-text">{{ faq.question }}</span>
              <span class="faq-toggle">
                {{ selectedFaq === faq.id ? '−' : '+' }}
              </span>
            </div>
            <div class="faq-answer" v-if="selectedFaq === faq.id">
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>

      <!-- 联系我们 -->
      <div class="help-section">
        <h2 class="section-title">{{ t('contactUs') }}</h2>
        <div class="contact-info">
          <div class="contact-item">
            <span class="contact-icon">📧</span>
            <span class="contact-text">support@example.com</span>
          </div>
          <div class="contact-item">
            <span class="contact-icon">📞</span>
            <span class="contact-text">400-123-4567</span>
          </div>
          <div class="contact-item">
            <span class="contact-icon">🕒</span>
            <span class="contact-text">周一至周五 9:00-18:00</span>
          </div>
        </div>
      </div>

      <!-- 反馈建议 -->
      <div class="help-section">
        <h2 class="section-title">{{ t('feedback') }}</h2>
        <div class="feedback-form">
          <textarea
            placeholder="请输入您的反馈或建议..."
            class="feedback-input"
          ></textarea>
          <button class="submit-button">{{ t('submit') }}</button>
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
.help-page {
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

/* 帮助区块 */
.help-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: rgba(255, 255, 255, 0.9);
}

/* 常见问题 */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.faq-item {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.faq-question:hover {
  background: rgba(255, 255, 255, 0.1);
}

.question-text {
  font-size: 0.9375rem;
  font-weight: 500;
}

.faq-toggle {
  font-size: 1.25rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.3s ease;
}

.faq-answer {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  font-size: 0.875rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* 联系信息 */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: background-color 0.3s ease;
}

.contact-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.contact-icon {
  font-size: 1.25rem;
  width: 32px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.contact-text {
  font-size: 0.9375rem;
  color: rgba(255, 255, 255, 0.8);
}

/* 反馈表单 */
.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-input {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  font-size: 0.9375rem;
  resize: vertical;
}

.feedback-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.submit-button {
  padding: 0.75rem;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(66, 184, 131, 0.4);
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
  .help-page {
    padding-bottom: 60px;
  }

  .header {
    padding: 0.75rem;
  }

  .help-section {
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 1.25rem;
  }

  .faq-question {
    padding: 0.875rem;
  }

  .question-text {
    font-size: 0.875rem;
  }

  .faq-answer {
    padding: 0.875rem;
    font-size: 0.8125rem;
  }

  .contact-item {
    padding: 0.625rem;
  }

  .contact-text {
    font-size: 0.875rem;
  }

  .feedback-input {
    padding: 0.875rem;
    font-size: 0.875rem;
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

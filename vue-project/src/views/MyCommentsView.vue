<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)

interface Comment {
  id: number
  eventId: number
  eventTitle: string
  coverImage: string
  content: string
  likeCount: number
  replyCount: number
  commentedAt: string
  isLiked: boolean
}

const mockComments = ref<Comment[]>([
  {
    id: 1,
    eventId: 101,
    eventTitle: '人工智能应用落地实战',
    coverImage: 'https://picsum.photos/400/300?random=30',
    content: '请问这个活动有实战代码环节吗？想了解一下具体的项目案例，学习一下业界最佳实践。',
    likeCount: 12,
    replyCount: 3,
    commentedAt: '2026-04-22 14:30',
    isLiked: true
  },
  {
    id: 2,
    eventId: 102,
    eventTitle: '创业者融资路演',
    coverImage: 'https://picsum.photos/400/300?random=31',
    content: '报名了！有没有一起去的小伙伴？可以组队交流～期待见到各位投资人！',
    likeCount: 28,
    replyCount: 8,
    commentedAt: '2026-04-20 09:15',
    isLiked: false
  },
  {
    id: 3,
    eventId: 103,
    eventTitle: '周末摄影采风活动',
    coverImage: 'https://picsum.photos/400/300?random=32',
    content: '去年参加过类似的活动，收获很大！这次继续报名，希望能认识更多摄影爱好者。',
    likeCount: 45,
    replyCount: 15,
    commentedAt: '2026-04-18 16:45',
    isLiked: true
  },
  {
    id: 4,
    eventId: 104,
    eventTitle: '英语口语角',
    coverImage: 'https://picsum.photos/400/300?random=33',
    content: '请问这个活动是每周都有吗？想长期参加提高口语水平，另外主题每次都会换吗？',
    likeCount: 8,
    replyCount: 5,
    commentedAt: '2026-04-15 11:20',
    isLiked: false
  }
])

const comments = ref<Comment[]>([])

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.get('/user-center/comments')
    if (response.success && response.data) {
      comments.value = response.data
    }
  } catch (err) {
    console.error('Error loading comments:', err)
  } finally {
    loading.value = false
  }
})

const goToEvent = (eventId: number) => {
  router.push(`/event/${eventId}`)
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/profile')
  }
}

const toggleLike = (comment: Comment, event: Event) => {
  event.stopPropagation()
  comment.isLiked = !comment.isLiked
  comment.likeCount += comment.isLiked ? 1 : -1
}
</script>

<template>
  <div class="comments-page">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1 class="page-title">
        <span class="title-icon">💬</span>
        我的评论
      </h1>
      <div class="header-actions">
        <span class="count-badge">{{ comments.length }} 条评论</span>
      </div>
    </div>

    <div class="page-content">
      <div v-if="comments.length === 0" class="empty-state">
        <div class="empty-icon">💬</div>
        <p class="empty-text">还没有发表过评论</p>
        <p class="empty-desc">在活动中分享你的想法和疑问吧！</p>
        <button class="explore-button" @click="router.push('/events')">
          浏览活动
        </button>
      </div>

      <div v-else class="comments-list">
        <div
          v-for="item in comments"
          :key="item.id"
          class="comment-item"
        >
          <div class="event-bar" @click="goToEvent(item.eventId)">
            <img :src="item.coverImage" :alt="item.eventTitle" class="event-thumb" />
            <span class="event-title">{{ item.eventTitle }}</span>
            <span class="goto-icon">›</span>
          </div>

          <div class="comment-body">
            <p class="comment-text">{{ item.content }}</p>
            <div class="comment-footer">
              <span class="comment-time">{{ item.commentedAt }}</span>
              <div class="comment-actions">
                <button
                  class="action-button like-button"
                  :class="{ liked: item.isLiked }"
                  @click="toggleLike(item, $event)"
                >
                  <span class="action-icon">{{ item.isLiked ? '❤️' : '🤍' }}</span>
                  <span class="action-count">{{ item.likeCount }}</span>
                </button>
                <div class="action-button reply-button">
                  <span class="action-icon">💬</span>
                  <span class="action-count">{{ item.replyCount }} 回复</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comments-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.back-button {
  background: #e8f5e9;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  border-radius: 8px;
  transition: all 0.3s;
}

.back-button:hover {
  background: #c8e6c9;
  transform: translateX(-3px);
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-icon {
  background: linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.header-actions {
  margin-left: auto;
}

.count-badge {
  background: linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.page-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.empty-state {
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.empty-desc {
  color: #999;
  margin-bottom: 2rem;
}

.explore-button {
  background: linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.explore-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(46, 125, 50, 0.4);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.comment-item {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.event-bar {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  background: #f1f8e9;
  border-bottom: 1px solid #c8e6c9;
  cursor: pointer;
  transition: background 0.3s;
  gap: 1rem;
}

.event-bar:hover {
  background: #dcedc8;
}

.event-thumb {
  width: 50px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.event-title {
  flex: 1;
  font-size: 0.95rem;
  color: #2e7d32;
  font-weight: 600;
}

.goto-icon {
  font-size: 1.5rem;
  color: #a5d6a7;
  font-weight: 300;
  transition: all 0.3s;
}

.event-bar:hover .goto-icon {
  color: #2e7d32;
  transform: translateX(5px);
}

.comment-body {
  padding: 1.25rem;
}

.comment-text {
  margin: 0 0 1rem 0;
  color: #444;
  line-height: 1.7;
  font-size: 0.95rem;
}

.comment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.comment-time {
  font-size: 0.8rem;
  color: #999;
}

.comment-actions {
  display: flex;
  gap: 1rem;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  background: #f5f5f5;
  color: #666;
}

.action-button:hover {
  background: #eee;
}

.like-button.liked {
  background: #ffebee;
  color: #e53935;
}

.reply-button:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.action-icon {
  font-size: 1rem;
}

.action-count {
  font-weight: 600;
}
</style>

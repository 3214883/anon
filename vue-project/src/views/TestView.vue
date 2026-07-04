<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../api'

const status = ref('')
const message = ref('')

const testBackendConnection = async () => {
  try {
    status.value = 'loading'
    const response = await api.get('/health')
    status.value = 'success'
    message.value = response.data?.message || 'Backend connection successful'
  } catch (error) {
    status.value = 'error'
    message.value = 'Failed to connect to backend'
  }
}

onMounted(() => {
  testBackendConnection()
})
</script>

<template>
  <div class="test-view">
    <div class="container">
      <h1>Backend Connection Test</h1>
      <div class="test-result">
        <div class="status" :class="status">
          {{ status === 'loading' ? 'Testing...' : status === 'success' ? 'Success' : 'Error' }}
        </div>
        <div class="message">{{ message }}</div>
        <button class="btn-test" @click="testBackendConnection">Test Again</button>
      </div>
      <div class="info">
        <h2>前后端分离配置信息</h2>
        <ul>
          <li><strong>前端地址:</strong> http://localhost:5173</li>
          <li><strong>后端地址:</strong> http://localhost:3000</li>
          <li><strong>API 基础路径:</strong> /api</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-view {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.08);
  max-width: 600px;
  width: 100%;
}

h1 {
  background: linear-gradient(135deg, #42b883 0%, #3498db 50%, #9b59b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
}

.test-result {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.status {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid transparent;
}

.status.loading {
  color: #f39c12;
  border-color: rgba(243, 156, 18, 0.3);
  background: rgba(243, 156, 18, 0.1);
}

.status.success {
  color: #42b883;
  border-color: rgba(66, 184, 131, 0.3);
  background: rgba(66, 184, 131, 0.1);
}

.status.error {
  color: #e74c3c;
  border-color: rgba(231, 76, 60, 0.3);
  background: rgba(231, 76, 60, 0.1);
}

.message {
  color: rgba(255, 255, 255, 0.75);
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 2rem;
  min-height: 2.5rem;
}

.btn-test {
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(66, 184, 131, 0.3);
  width: 100%;
}

.btn-test:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(66, 184, 131, 0.5);
}

.info {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info h2 {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.info ul {
  list-style: none;
  color: rgba(255, 255, 255, 0.75);
}

.info li {
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
  position: relative;
}

.info li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #42b883;
  font-size: 1.25rem;
  font-weight: bold;
}

.info strong {
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
  .container {
    padding: 2rem;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>

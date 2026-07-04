<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index'

const router = useRouter()

interface User {
  id: number
  username: string
  email: string
  phone: string | null
  password?: string
  role: string
  isActive: boolean
  createdAt: string
}

const users = ref<User[]>([])
const isEditing = ref(false)
const editForm = ref<User>({
  id: 0,
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'user',
  isActive: true,
  createdAt: ''
})
const error = ref('')
const successMessage = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const totalUsers = ref(0)
const totalPages = computed(() => Math.ceil(totalUsers.value / pageSize.value))

const user = computed(() => {
  const stored = localStorage.getItem('user')
  return stored ? JSON.parse(stored) : null
})

onMounted(() => {
  if (user.value?.role !== 'admin') {
    router.push('/')
    return
  }
  loadUsers()
})

const loadUsers = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await api.get('/admin/users', {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        search: searchQuery.value
      }
    })

    if (response.success) {
      users.value = response.data.users
      totalUsers.value = response.data.pagination.total
    }
  } catch (err) {
    error.value = '加载用户列表失败'
    console.error('Error loading users:', err)
  } finally {
    loading.value = false
  }
}

const startEdit = (user: User) => {
  editForm.value = {
    ...user,
    phone: user.phone || '',
    password: ''
  }
  isEditing.value = true
  error.value = ''
  successMessage.value = ''
}

const resetPassword = () => {
  editForm.value.password = '123456'
  window.alert('✅ 密码已设置为 123456，点击保存生效')
}

const saveUser = async () => {
  if (!editForm.value.username || !editForm.value.email) {
    error.value = '用户名和邮箱不能为空'
    return
  }

  try {
    loading.value = true
    error.value = ''

    const response = await api.put(`/admin/users/${editForm.value.id}`, editForm.value)

    if (response.success) {
      await loadUsers()
      isEditing.value = false
      successMessage.value = '用户信息已更新'
      setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (err) {
    error.value = '更新用户信息失败'
    console.error('Error updating user:', err)
  } finally {
    loading.value = false
  }
}

const toggleUserStatus = async (user: User) => {
  try {
    const response = await api.put(`/admin/users/${user.id}`, {
      ...user,
      isActive: !user.isActive
    })

    if (response.success) {
      await loadUsers()
      successMessage.value = user.isActive ? '用户已禁用' : '用户已启用'
      setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (err) {
    error.value = '操作失败'
    console.error('Error toggling user status:', err)
  }
}

const deleteUser = async (user: User) => {
  if (!window.confirm(`确定要删除用户 "${user.username}" 吗？`)) {
    return
  }

  try {
    const response = await api.delete(`/admin/users/${user.id}`)

    if (response.success) {
      await loadUsers()
      successMessage.value = '用户已删除'
      setTimeout(() => successMessage.value = '', 3000)
    }
  } catch (err) {
    error.value = '删除用户失败'
    console.error('Error deleting user:', err)
  }
}

const goBack = () => {
  if (isEditing.value) {
    isEditing.value = false
  } else {
    router.push('/')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadUsers()
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadUsers()
  }
}

const getRoleBadgeClass = (role: string) => {
  return role === 'admin' ? 'badge-admin' : 'badge-user'
}

const getStatusBadgeClass = (isActive: boolean) => {
  return isActive ? 'badge-active' : 'badge-inactive'
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-container">
      <div class="page-header">
        <button class="back-btn" @click="goBack">← 返回</button>
        <div class="header-info">
          <h1 class="page-title">用户管理</h1>
          <p class="page-desc">管理平台所有用户账户</p>
        </div>
        <div class="header-stats">
          <div class="stat-card">
            <div class="stat-value">{{ totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
      </div>

      <div v-if="successMessage" class="alert success">
        {{ successMessage }}
      </div>
      <div v-if="error" class="alert error">
        {{ error }}
      </div>

      <div class="toolbar">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索用户名或邮箱..."
            @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">🔍</button>
        </div>
      </div>

      <div class="content-card">
        <div class="table-wrapper" v-if="!isEditing">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="loading-cell">
                  <div class="spinner"></div>
                  加载中...
                </td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="7" class="empty-cell">
                  暂无用户数据
                </td>
              </tr>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td class="username-cell">
                  <div class="user-avatar">{{ user.username.charAt(0) }}</div>
                  {{ user.username }}
                </td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" :class="getRoleBadgeClass(user.role)">
                    {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(user.isActive)">
                    {{ user.isActive ? '正常' : '禁用' }}
                  </span>
                </td>
                <td>{{ new Date(user.createdAt).toLocaleDateString() }}</td>
                <td class="actions-cell">
                  <button class="btn-icon edit" @click="startEdit(user)">✏️</button>
                  <button
                    class="btn-icon toggle"
                    :class="{ active: user.isActive }"
                    @click="toggleUserStatus(user)"
                  >
                    {{ user.isActive ? '⏸️' : '▶️' }}
                  </button>
                  <button class="btn-icon delete" @click="deleteUser(user)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="edit-form">
          <h3>编辑用户</h3>
          <div class="form-row">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="editForm.username" type="text" />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="editForm.email" type="email" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>手机号</label>
              <input v-model="editForm.phone" type="text" placeholder="未设置手机号" />
            </div>
            <div class="form-group">
              <label>角色</label>
              <select v-model="editForm.role">
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>新密码 <span class="hint">(留空则不修改)</span></label>
              <input v-model="editForm.password" type="password" placeholder="输入新密码" />
            </div>
            <div class="form-group">
              <label>快捷操作</label>
              <button class="btn btn-reset-password" @click="resetPassword" type="button">
                🔑 重置为 123456
              </button>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn btn-cancel" @click="isEditing = false">取消</button>
            <button class="btn btn-save" @click="saveUser" :disabled="loading">
              {{ loading ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>

        <div v-if="!isEditing && totalPages > 1" class="pagination">
          <button
            class="page-btn"
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
          >
            ‹ 上一页
          </button>
          <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
          <button
            class="page-btn"
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
          >
            下一页 ›
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 50%, #d9dfe6 100%);
  padding: 2rem;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.back-btn {
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #f8f9fa;
  transform: translateX(-2px);
}

.header-info {
  flex: 1;
}

.page-title {
  color: #1a1a2e;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-desc {
  color: rgba(0, 0, 0, 0.5);
  font-size: 0.9rem;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: #ffffff;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.5);
}

.alert {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.alert.success {
  background: linear-gradient(135deg, rgba(66, 184, 131, 0.1) 0%, rgba(66, 184, 131, 0.05) 100%);
  border: 1px solid rgba(66, 184, 131, 0.2);
  color: #27ae60;
}

.alert.success::before {
  content: '✅';
}

.alert.error {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 107, 107, 0.05) 100%);
  border: 1px solid rgba(255, 107, 107, 0.2);
  color: #e74c3c;
}

.alert.error::before {
  content: '⚠️';
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  max-width: 400px;
}

.search-box input {
  flex: 1;
  padding: 0.875rem 1rem;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-box input:focus {
  outline: none;
  border-color: rgba(66, 184, 131, 0.5);
  box-shadow: 0 0 0 4px rgba(66, 184, 131, 0.1);
}

.search-btn {
  padding: 0.875rem 1.25rem;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(66, 184, 131, 0.3);
}

.content-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: #f8f9fa;
}

.data-table th {
  padding: 1rem 1.25rem;
  text-align: left;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.data-table td {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  color: #1a1a2e;
}

.data-table tbody tr {
  transition: all 0.3s ease;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.username-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-admin {
  background: linear-gradient(135deg, rgba(155, 89, 182, 0.15) 0%, rgba(155, 89, 182, 0.1) 100%);
  color: #9b59b6;
}

.badge-user {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.15) 0%, rgba(52, 152, 219, 0.1) 100%);
  color: #3498db;
}

.badge-active {
  background: linear-gradient(135deg, rgba(66, 184, 131, 0.15) 0%, rgba(66, 184, 131, 0.1) 100%);
  color: #27ae60;
}

.badge-inactive {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 107, 107, 0.1) 100%);
  color: #e74c3c;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.btn-icon.edit {
  background: rgba(52, 152, 219, 0.1);
}

.btn-icon.edit:hover {
  background: rgba(52, 152, 219, 0.2);
  transform: scale(1.1);
}

.btn-icon.toggle {
  background: rgba(241, 196, 15, 0.1);
}

.btn-icon.toggle:hover {
  background: rgba(241, 196, 15, 0.2);
  transform: scale(1.1);
}

.btn-icon.delete {
  background: rgba(255, 107, 107, 0.1);
}

.btn-icon.delete:hover {
  background: rgba(255, 107, 107, 0.2);
  transform: scale(1.1);
}

.loading-cell,
.empty-cell {
  text-align: center;
  padding: 3rem !important;
  color: rgba(0, 0, 0, 0.5);
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(66, 184, 131, 0.3);
  border-top-color: #42b883;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 0.5rem;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.edit-form {
  padding: 2rem;
}

.edit-form h3 {
  color: #1a1a2e;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-group label .hint {
  font-weight: 400;
  color: rgba(0, 0, 0, 0.4);
  font-size: 0.8rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: #f8f9fa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  font-size: 0.95rem;
  color: #1a1a2e;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: rgba(66, 184, 131, 0.5);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(66, 184, 131, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
}

.btn-reset-password {
  width: 100%;
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-reset-password:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(243, 156, 18, 0.3);
}

.btn-cancel {
  background: #f8f9fa;
  color: rgba(0, 0, 0, 0.65);
}

.btn-cancel:hover {
  background: #eff2f5;
}

.btn-save {
  background: linear-gradient(135deg, #42b883 0%, #3498db 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(66, 184, 131, 0.3);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(66, 184, 131, 0.4);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.page-btn {
  padding: 0.625rem 1rem;
  background: #f8f9fa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #eff2f5;
  color: #42b883;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: rgba(0, 0, 0, 0.5);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .admin-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }
}
</style>

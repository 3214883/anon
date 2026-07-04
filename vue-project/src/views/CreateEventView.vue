<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { eventService } from '../api/services'

const { t, locale } = useI18n()
const router = useRouter()

const formData = ref({
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  category: '社交聚会',
  categoryId: 1,
  capacity: 10,
  fee: 0,
  image: ''
})

const imagePreview = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      formData.value.image = result
      imagePreview.value = result
    }

    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  formData.value.image = ''
  imagePreview.value = ''
}

const categories = ref([
  { value: 1, label: '社交聚会', name: '社交聚会' },
  { value: 2, label: '教育培训', name: '教育培训' },
  { value: 3, label: '商务会议', name: '商务会议' },
  { value: 4, label: '文化艺术', name: '文化艺术' },
  { value: 5, label: '体育健身', name: '体育健身' },
  { value: 6, label: '亲子家庭', name: '亲子家庭' },
  { value: 7, label: '公益慈善', name: '公益慈善' },
  { value: 8, label: '展览展销', name: '展览展销' },
  { value: 9, label: '娱乐休闲', name: '娱乐休闲' },
  { value: 10, label: '行业专业', name: '行业专业' },
  { value: 11, label: '美食餐饮', name: '美食餐饮' }
])

onMounted(() => {
  const userData = localStorage.getItem('user')
  if (!userData) {
    router.push('/login')
    return
  }

  const user = JSON.parse(userData)
  if (user.role === 'admin') {
    router.push('/')
    return
  }

  updateCategoriesLabels()
})

const updateCategoriesLabels = () => {
  categories.value = [
    { value: 1, label: t('eventTypes.社交聚会'), name: '社交聚会' },
    { value: 2, label: t('eventTypes.教育培训'), name: '教育培训' },
    { value: 3, label: t('eventTypes.商务会议'), name: '商务会议' },
    { value: 4, label: t('eventTypes.文化艺术'), name: '文化艺术' },
    { value: 5, label: t('eventTypes.体育健身'), name: '体育健身' },
    { value: 6, label: t('eventTypes.亲子家庭'), name: '亲子家庭' },
    { value: 7, label: t('eventTypes.公益慈善'), name: '公益慈善' },
    { value: 8, label: t('eventTypes.展览展销'), name: '展览展销' },
    { value: 9, label: t('eventTypes.娱乐休闲'), name: '娱乐休闲' },
    { value: 10, label: t('eventTypes.行业专业'), name: '行业专业' },
    { value: 11, label: t('eventTypes.美食餐饮'), name: '美食餐饮' }
  ]
}
watch(locale, () => {
  updateCategoriesLabels()
})

const handleCategoryChange = () => {
  const selectedCat = categories.value.find(c => c.value === formData.value.categoryId)
  if (selectedCat) {
    formData.value.category = selectedCat.name
  }
}

const errors = ref<Record<string, string>>({})

const validateForm = () => {
  errors.value = {}

  if (!formData.value.title.trim()) {
    errors.value.title = t('requiredField')
  }
  if (!formData.value.description.trim()) {
    errors.value.description = t('requiredField')
  }
  if (!formData.value.date) {
    errors.value.date = t('requiredField')
  }
  if (!formData.value.startTime) {
    errors.value.startTime = t('requiredField')
  }
  if (!formData.value.location.trim()) {
    errors.value.location = t('requiredField')
  }

  return Object.keys(errors.value).length === 0
}

const submitForm = async () => {
  if (validateForm()) {
    try {
      console.log('Submitting event creation request:', formData.value)

      const response = await eventService.createEvent({
        title: formData.value.title,
        description: formData.value.description,
        date: formData.value.date,
        startTime: formData.value.startTime,
        endTime: formData.value.endTime,
        location: formData.value.location,
        address: formData.value.location,
        capacity: formData.value.capacity,
        price: formData.value.fee,
        coverImage: formData.value.image,
        category: formData.value.category,
        categoryId: formData.value.categoryId,
        tags: '' // 暂时为空字符串
      })

      console.log('Event creation response:', response)

      if (response.data) {
        console.log('Event created:', response.data)
        window.alert('✅ 活动已提交！请等待管理员审核通过后，将自动发布到活动列表')
        router.push('/events')
      } else {
        window.alert('发布失败，请重试')
      }
    } catch (error: any) {
      console.error('Error creating event:', error)
      alert(t('eventCreationFailed'))
    }
  }
}

const resetForm = () => {
  formData.value = {
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    category: '社交聚会',
    categoryId: 1,
    capacity: 10,
    fee: 0,
    image: ''
  }
  errors.value = {}
  router.push('/events')
}
</script>

<template>
  <div class="create-event-page">
    <div class="header-section">
      <div class="container">
        <h1 class="page-title">{{ $t('createEvent') }}</h1>
      </div>
    </div>

    <div class="container">
      <form class="event-form" @submit.prevent="submitForm">
        <div class="form-group">
          <label for="title">{{ $t('eventTitle') }} *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            :placeholder="$t('eventTitle')"
            :class="{ error: errors.title }"
          />
          <span v-if="errors.title" class="error-message">{{ errors.title }}</span>
        </div>

        <div class="form-group">
          <label for="description">{{ $t('eventDescription') }} *</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="4"
            :placeholder="$t('eventDescription')"
            :class="{ error: errors.description }"
          ></textarea>
          <span v-if="errors.description" class="error-message">{{ errors.description }}</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="date">{{ $t('eventDate') }} *</label>
            <input
              id="date"
              v-model="formData.date"
              type="date"
              :class="{ error: errors.date }"
            />
            <span v-if="errors.date" class="error-message">{{ errors.date }}</span>
          </div>

          <div class="form-group">
            <label for="startTime">{{ $t('startTime') }} *</label>
            <input
              id="startTime"
              v-model="formData.startTime"
              type="time"
              :class="{ error: errors.startTime }"
            />
            <span v-if="errors.startTime" class="error-message">{{ errors.startTime }}</span>
          </div>
          <div class="form-group">
            <label for="endTime">{{ $t('endTime') }}</label>
            <input
              id="endTime"
              v-model="formData.endTime"
              type="time"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="location">{{ $t('eventLocation') }} *</label>
          <input
            id="location"
            v-model="formData.location"
            type="text"
            :placeholder="$t('eventLocation')"
            :class="{ error: errors.location }"
          />
          <span v-if="errors.location" class="error-message">{{ errors.location }}</span>
        </div>

        <div class="form-group">
          <label>{{ $t('eventImage') }}</label>
          <div class="image-upload">
            <div class="image-preview" v-if="imagePreview">
              <img :src="imagePreview" :alt="formData.title" />
              <button type="button" class="btn-remove" @click="removeImage">
                ×
              </button>
            </div>
            <div class="image-upload-placeholder" v-else @click="fileInput?.click()">
              <span class="icon">📷</span>
              <span>{{ $t('uploadImage') }}</span>
              <input ref="fileInput" type="file" accept="image/*" @change="handleImageUpload" />
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">{{ $t('eventCategory') }}</label>
            <select id="category" v-model="formData.categoryId" @change="handleCategoryChange">
              <option v-for="cat in categories" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="capacity">{{ $t('eventCapacity') }}</label>
            <input
              id="capacity"
              v-model.number="formData.capacity"
              type="number"
              min="1"
              max="100"
            />
          </div>

          <div class="form-group">
            <label for="fee">{{ $t('eventFee') }} (¥)</label>
            <input
              id="fee"
              v-model.number="formData.fee"
              type="number"
              min="0"
              step="100"
            />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">{{ $t('submit') }}</button>
          <button type="button" class="btn btn-secondary" @click="resetForm">{{ $t('cancel') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.create-event-page {
  min-height: 100vh;
  padding: 2rem 0 4rem;
  background: #f5f7fa;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-section {
  width: 100%;
  margin-bottom: 2rem;
}

.header-section .container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.page-title {
  font-size: 2rem;
  color: #333;
  margin: 0;
  text-align: center;
}

.event-form {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

label {
  display: block;
  color: #555;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input,
select,
textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.1);
}

input.error,
textarea.error {
  border-color: #e74c3c;
}

input::placeholder,
textarea::placeholder {
  color: #999;
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M8 12l-4-4h8l-4 4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px 12px;
  padding-right: 2.5rem;
  cursor: pointer;
}

select option {
  background: white;
  color: #333;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
}

.image-upload {
  margin-top: 0.5rem;
}

.image-preview {
  position: relative;
  width: 100%;
  max-width: 400px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.image-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.btn-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #f0f0f0;
  color: #e74c3c;
  border: 1px solid #ddd;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.btn-remove:hover {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
  transform: scale(1.1);
}

.image-upload-placeholder {
  width: 100%;
  max-width: 400px;
  height: 200px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-upload-placeholder:hover {
  border-color: #42b883;
  background: #f0f9f0;
}

.image-upload-placeholder .icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: #ccc;
}

.image-upload-placeholder span:not(.icon) {
  color: #666;
}

.image-upload-placeholder input[type="file"] {
  display: none;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover {
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
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.75rem;
  }

  .event-form {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

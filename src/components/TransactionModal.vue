<template>
  <div class="modal" @click.self="$emit('cancel')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ transaction ? '编辑事务' : '添加事务' }}</h3>
        <span class="close" @click="$emit('cancel')">&times;</span>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>事务名称:</label>
            <input type="text" v-model="formData.name" required>
          </div>
          
          <div class="form-group">
            <label>颜色:</label>
            <input type="color" v-model="formData.color">
          </div>
          
          <div class="form-group">
            <label>开始时间:</label>
            <input type="datetime-local" v-model="formData.startTime">
          </div>
          
          <div class="form-group">
            <label>结束时间:</label>
            <input type="datetime-local" v-model="formData.endTime">
          </div>
          
          <div class="form-group">
            <label>固定时长(分钟):</label>
            <input type="number" v-model="formData.duration" min="1" placeholder="留空表示不固定时长">
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" class="btn btn-secondary" @click="$emit('cancel')">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, onMounted } from 'vue'

export default {
  name: 'TransactionModal',
  props: {
    transaction: {
      type: Object,
      default: null
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const formData = reactive({
      name: '',
      color: '#4CAF50',
      startTime: '',
      endTime: '',
      duration: ''
    })

    const extractBackgroundColor = (style) => {
      if (!style) return '#4CAF50'
      const match = style.match(/background[^:]*:\s*([^;]+)/)
      return match ? match[1].trim() : '#4CAF50'
    }

    const formatDateTimeLocal = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }

    const handleSubmit = () => {
      const data = {
        id: props.transaction ? props.transaction.id : 'item_' + Date.now(),
        content: formData.name,
        start: new Date(formData.startTime),
        end: new Date(formData.endTime),
        style: `background-color: ${formData.color}; color: white; border-radius: 4px;`,
        duration: formData.duration ? parseInt(formData.duration) : null
      }
      emit('save', data)
    }

    onMounted(() => {
      if (props.transaction) {
        formData.name = props.transaction.content
        formData.color = extractBackgroundColor(props.transaction.style)
        formData.startTime = formatDateTimeLocal(props.transaction.start)
        formData.endTime = formatDateTimeLocal(props.transaction.end)
      } else {
        const now = new Date()
        formData.startTime = formatDateTimeLocal(now)
        formData.endTime = formatDateTimeLocal(new Date(now.getTime() + 60 * 60 * 1000))
      }
    })

    return {
      formData,
      handleSubmit
    }
  }
}
</script>

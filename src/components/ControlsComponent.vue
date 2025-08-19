<template>
  <div class="controls">
    <div class="control-group">
      <button class="btn btn-primary" @click="handleAddTransaction">添加事务</button>
      <button class="btn btn-secondary" @click="handleAddConstraint">添加约束</button>
      <button class="btn btn-danger" @click="handleReset">重置</button>
    </div>
    
    <div class="time-range-controls">
      <label for="start-time">时间轴起始时间:</label>
      <input 
        type="datetime-local" 
        ref="startTime"
        :value="startTimeFormatted"
        @change="handleTimeRangeChange"
      >
      
      <label for="end-time">时间轴结束时间:</label>
      <input 
        type="datetime-local" 
        ref="endTime"
        :value="endTimeFormatted"
        @change="handleTimeRangeChange"
      >
      
      <label for="time-scale">时间刻度:</label>
      <select ref="timeScale" :value="timeScale" @change="handleTimeRangeChange">
        <option value="15">15分钟</option>
        <option value="30">30分钟</option>
        <option value="60">1小时</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ControlsComponent',
  props: {
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    timeScale: {
      type: Number,
      default: 30
    }
  },
  emits: ['add-transaction', 'add-constraint', 'reset', 'time-range-change'],
  computed: {
    startTimeFormatted() {
      return this.formatDateTimeLocal(this.startTime)
    },
    endTimeFormatted() {
      return this.formatDateTimeLocal(this.endTime)
    }
  },
  methods: {
    formatDateTimeLocal(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    },
    handleAddTransaction() {
      console.log('🔵 点击添加事务按钮')
      this.$emit('add-transaction')
    },
    handleAddConstraint() {
      console.log('🔵 点击添加约束按钮')
      this.$emit('add-constraint')
    },
    handleReset() {
      console.log('🔵 点击重置按钮')
      this.$emit('reset')
    },
    handleTimeRangeChange() {
      const startInput = this.$refs.startTime
      const endInput = this.$refs.endTime
      const scaleInput = this.$refs.timeScale
      
      console.log('🔵 时间范围变更')
      this.$emit('time-range-change', {
        start: new Date(startInput.value),
        end: new Date(endInput.value),
        scale: parseInt(scaleInput.value)
      })
    }
  }
}
</script>
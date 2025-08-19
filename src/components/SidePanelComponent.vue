<template>
  <div class="side-panel">
    <div class="transactions-panel">
      <h3>事务列表</h3>
      <div class="transactions-list">
        <div 
          v-for="item in items" 
          :key="item.id"
          class="transaction-item"
          :class="{ selected: isItemSelected(item.id) }"
        >
          <div class="transaction-color" :style="{ backgroundColor: extractBackgroundColor(item.style) }"></div>
          <div class="transaction-info">
            <div class="transaction-name">{{ item.content }}</div>
            <div class="transaction-time">
              {{ formatTime(item.start) }} - {{ formatTime(item.end) }}
              ({{ getDuration(item) }}分钟)
            </div>
          </div>
          <div class="transaction-actions">
            <button class="edit-btn" @click="$emit('edit-transaction', item.id)">编辑</button>
            <button class="delete-btn" @click="$emit('delete-transaction', item.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="constraints-panel">
      <h3>约束条件</h3>
      <div class="constraints-list">
        <div 
          v-for="constraint in constraintsArray" 
          :key="constraint.id"
          class="constraint-item"
        >
          <div class="constraint-description">{{ constraint.description }}</div>
          <div class="constraint-status" :class="{ valid: constraint.isValid, invalid: !constraint.isValid }">
            {{ constraint.isValid ? '✓ 满足' : '✗ 不满足' }}
          </div>
          <div class="constraint-actions">
            <button class="edit-btn" @click="$emit('edit-constraint', constraint.id)">编辑</button>
            <button class="delete-btn" @click="$emit('delete-constraint', constraint.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SidePanelComponent',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    constraints: {
      type: Map,
      default: () => new Map()
    },
    selectedItems: {
      type: Array,
      default: () => []
    }
  },
  emits: ['edit-transaction', 'delete-transaction', 'edit-constraint', 'delete-constraint'],
  computed: {
    constraintsArray() {
      return Array.from(this.constraints.values())
    }
  },
  methods: {
    formatTime(date) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    },
    getDuration(item) {
      return Math.round((item.end - item.start) / (1000 * 60))
    },
    extractBackgroundColor(style) {
      if (!style) return '#3498db'
      const match = style.match(/background[^:]*:\s*([^;]+)/)
      return match ? match[1].trim() : '#3498db'
    },
    isItemSelected(itemId) {
      return this.selectedItems.includes(itemId)
    }
  }
}
</script>

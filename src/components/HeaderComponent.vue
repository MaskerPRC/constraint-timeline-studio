<template>
  <header class="header">
    <div class="header-content">
      <div class="header-brand">
        <img src="/logo.png" alt="Logo" class="logo">
        <div class="header-text">
          <h1>时间区块调整工具</h1>
          <p class="subtitle">自动时间区块调整获取完整测试边界条件</p>
        </div>
      </div>
      <div class="header-actions">
        <button 
          class="btn btn-ghost" 
          @click="$emit('theme-toggle')"
          :aria-label="currentTheme === 'dark' ? '切换到浅色' : '切换到深色'"
          :title="currentTheme === 'dark' ? '切换到浅色' : '切换到深色'"
        >
          {{ currentTheme === 'dark' ? '☀️' : '🌙' }}
        </button>
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'HeaderComponent',
  props: {
    currentTheme: {
      type: String,
      default: 'light'
    }
  },
  emits: ['theme-toggle']
}
</script>
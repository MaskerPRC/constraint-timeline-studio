import { createApp } from 'vue'
import App from './App.vue'

// 导入全局样式
import './styles.css'
// 导入vis-timeline样式
import 'vis-timeline/styles/vis-timeline-graph2d.css'

// 添加启动日志
console.log('🚀 开始初始化 Vue 应用...')
console.log('📍 当前时间:', new Date().toLocaleString())
console.log('🌍 当前URL:', window.location.href)

// 创建Vue应用实例
const app = createApp(App)

// 添加更详细的错误日志
window.addEventListener('error', (event) => {
  console.error('🔴 全局JavaScript错误:', event.error)
  console.error('📝 错误详情:', event.message)
  console.error('📍 错误位置:', event.filename, ':', event.lineno)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 未捕获的Promise拒绝:', event.reason)
})

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue应用错误:', err)
  console.error('错误信息:', info)
  console.error('组件实例:', vm)
}

// 全局警告处理
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Vue警告:', msg)
  console.warn('组件追踪:', trace)
}

// 挂载应用
app.mount('#app')

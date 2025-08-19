import { createApp } from 'vue'
import App from './App.vue'

// 导入全局样式
import './styles.css'
// 导入vis-timeline样式
import 'vis-timeline/styles/vis-timeline-graph2d.css'



// 创建Vue应用实例
const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue应用错误:', err, info)
}

// 挂载应用
app.mount('#app')

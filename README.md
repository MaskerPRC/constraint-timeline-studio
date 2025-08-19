# 时间区块调整工具 - Vue 3 专业版

## 项目概述

这是一个基于Vue 3 + Vite构建的专业时间区块调整工具，采用现代化的前端开发架构，支持复杂的约束系统和实时约束处理。该工具特别适用于项目管理、时间规划和测试边界条件设计等场景。

## ✨ 核心特性

### 🚀 现代化技术栈
- **Vue 3** - 使用最新的Composition API
- **Vite** - 极速的构建工具和开发服务器
- **Single File Components** - 标准的Vue组件开发模式
- **ES6+ Modules** - 现代JavaScript模块系统
- **TypeScript Ready** - 支持TypeScript（可选）

### 📊 专业时间轴功能
- **vis-timeline集成** - 企业级时间轴可视化
- **多轨道支持** - 每个事务独立时间轴
- **实时约束处理** - 拖拽时自动满足约束条件
- **智能时间对齐** - 自动15/30/60分钟间隔对齐
- **响应式设计** - 完美适配桌面和移动设备

### 🧠 智能约束系统
- **12种约束类型** - 覆盖各种时间关系场景
- **实时约束传播** - 毫秒级响应和自动调整
- **冲突检测机制** - 智能识别和解决约束冲突
- **可视化状态反馈** - 实时显示约束满足状态

### 🎨 优秀用户体验
- **直观拖拽操作** - 平滑的时间调整体验
- **右键快捷菜单** - 便捷的操作入口
- **深色模式支持** - 自动适配系统主题
- **流畅动画效果** - 优雅的视觉反馈

## 📁 项目结构

```
time-range-control/
├── public/                    # 静态资源目录
│   ├── index.html            # 应用入口HTML
│   └── logo.png              # 应用图标
├── src/                      # 源代码目录
│   ├── components/           # Vue组件
│   │   ├── HeaderComponent.vue       # 头部组件
│   │   ├── ControlsComponent.vue     # 控制面板组件
│   │   ├── TimelineComponent.vue     # 时间轴组件
│   │   ├── SidePanelComponent.vue    # 侧边面板组件
│   │   ├── TransactionModal.vue      # 事务模态框
│   │   ├── ConstraintModal.vue       # 约束模态框
│   │   ├── ContextMenu.vue           # 右键菜单
│   │   └── ColorPicker.vue           # 颜色选择器
│   ├── utils/                # 工具类
│   │   └── ConstraintSystem.js       # 约束系统核心逻辑
│   ├── App.vue               # 根组件
│   ├── main.js               # 应用入口文件
│   └── styles.css            # 全局样式
├── package.json              # 项目配置和依赖
├── vite.config.js            # Vite构建配置
├── .eslintrc.cjs             # ESLint代码规范
├── .prettierrc               # Prettier代码格式化
├── .gitignore                # Git忽略文件
└── README.md                 # 项目说明文档
```

## 🛠️ 开发环境设置

### 环境要求
- **Node.js** >= 16.0.0
- **npm** >= 7.0.0 或 **yarn** >= 1.22.0

### 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd time-range-control
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **打开浏览器**
访问 `http://localhost:4190` 查看应用

### 可用脚本

```bash
# 开发服务器 (热重载)
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查和修复
npm run lint

# 代码格式化
npm run format

# 启动预览服务器
npm run serve
```

## 🚀 使用指南

### 基本操作

#### 1. 添加事务
- 点击"添加事务"按钮
- 填写事务名称、颜色、时间等信息
- 或双击时间轴空白区域快速创建

#### 2. 设置约束
- 点击"添加约束"按钮
- 选择约束类型和相关事务
- 系统自动应用约束规则

#### 3. 交互操作
- **拖拽调整** - 拖拽事务块边缘或中央调整时间
- **双击编辑** - 双击事务块打开详细编辑
- **右键菜单** - 右键显示快速操作选项
- **缩放控制** - 使用工具栏按钮控制时间轴显示

### 约束类型说明

| 约束类型 | 说明 | 应用场景 |
|---------|------|----------|
| **时间顺序关系** |
| A必须在B结束后开始 | 串行依赖关系 | 项目阶段依赖 |
| A必须在B开始前开始 | 前置条件 | 准备工作 |
| A必须在B结束前开始 | 并行约束 | 同步开发 |
| A必须在B开始前结束 | 完成依赖 | 交付要求 |
| **时间偏移关系** |
| A必须在B开始后X分钟开始 | 延迟启动 | 缓冲时间 |
| A必须在B开始后精确X分钟开始 | 精确定时 | 严格时序 |
| **时间长度限制** |
| A必须持续固定X分钟 | 固定时长 | 标准流程 |

## 🏗️ 架构设计

### 组件架构
```
App.vue (根组件)
├── HeaderComponent (头部品牌和主题切换)
├── ControlsComponent (操作控制面板)
├── TimelineComponent (vis-timeline时间轴)
├── SidePanelComponent (事务和约束列表)
├── TransactionModal (事务编辑模态框)
├── ConstraintModal (约束设置模态框)
├── ContextMenu (右键快捷菜单)
└── ColorPicker (颜色选择器)
```

### 数据流设计
```
用户操作 → 事件触发 → 状态更新 → 约束处理 → UI重新渲染
```

### 约束系统架构
```javascript
ConstraintSystem
├── processConstraints() // 约束处理主循环
├── applyConstraint() // 应用单个约束
├── validateConstraints() // 验证约束状态
└── enforce*() // 各种约束执行方法
```

## 🧪 测试和质量保证

### 代码规范
- **ESLint** - JavaScript/Vue代码检查
- **Prettier** - 代码格式化统一
- **Vue官方风格指南** - 组件开发规范

### 浏览器兼容性
- Chrome 61+ ✅
- Firefox 60+ ✅
- Safari 11+ ✅
- Edge 16+ ✅

## 📦 构建和部署

### 构建生产版本
```bash
npm run build
```

构建产物将输出到 `dist/` 目录，包含：
- 优化的JavaScript包
- CSS样式文件
- 静态资源文件
- 生产环境HTML

### 部署选项

#### 静态网站托管
```bash
# 构建后上传dist目录到以下平台：
# - Netlify
# - Vercel
# - GitHub Pages
# - 阿里云OSS
# - 腾讯云COS
```

#### 服务器部署
```bash
# 使用nginx或apache服务静态文件
# 配置路由重定向到index.html (SPA模式)
```

#### Docker部署
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 自定义和扩展

### 添加新组件
```vue
<!-- src/components/NewComponent.vue -->
<template>
  <div class="new-component">
    <!-- 组件内容 -->
  </div>
</template>

<script>
export default {
  name: 'NewComponent',
  // 组件逻辑
}
</script>

<style scoped>
/* 组件样式 */
</style>
```

### 扩展约束类型
```javascript
// 在ConstraintSystem.js中添加新方法
enforceCustomConstraint(itemA, itemB, params) {
  // 自定义约束逻辑
  return hasChanged
}
```

### 主题定制
```css
/* 在src/styles.css中修改CSS变量 */
:root {
  --primary-color: #your-color;
  --secondary-color: #your-color;
}
```

## 📚 技术文档

### 依赖说明
- **vue** - Vue.js 3.x 核心框架
- **vis-timeline** - 专业时间轴可视化库
- **@vitejs/plugin-vue** - Vite的Vue插件
- **eslint** - 代码质量检查工具
- **prettier** - 代码格式化工具

### API参考
详细的组件API和方法说明请参考源码中的JSDoc注释。

### 性能优化
- **代码分割** - Vite自动进行代码分割
- **Tree Shaking** - 移除未使用的代码
- **资源压缩** - 生产构建自动压缩
- **CDN优化** - 可配置CDN加速静态资源

## 🤝 贡献指南

1. **Fork** 项目仓库
2. **创建** 特性分支 (`git checkout -b feature/AmazingFeature`)
3. **提交** 更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送** 到分支 (`git push origin feature/AmazingFeature`)
5. **创建** Pull Request

### 开发规范
- 遵循Vue 3官方风格指南
- 使用Composition API
- 编写清晰的组件文档
- 添加适当的类型注释
- 确保代码通过ESLint检查

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [vis-timeline](https://visjs.github.io/vis-timeline/) - 时间轴可视化库
- 所有贡献者和使用者

---

💡 **这个工具为项目管理和时间规划提供了专业级的解决方案，通过现代化的Vue 3架构确保了优秀的开发体验和用户体验。**

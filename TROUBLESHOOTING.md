# 🔧 故障排除指南

## vis-timeline加载问题

如果您遇到"vis is not defined"错误，请按照以下步骤排除问题：

### 1. 检查网络连接
```bash
# 测试是否能访问CDN
curl -I https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js
```

### 2. 使用测试页面验证
在浏览器中打开 `test-vis.html` 文件，查看vis-timeline是否能正确加载。

### 3. 检查浏览器控制台
打开开发者工具，查看是否有网络错误或JavaScript错误。

### 4. 尝试本地启动
确保使用本地服务器而不是直接打开文件：

```bash
# 方法1: 使用项目的开发服务器
npm run dev

# 方法2: 使用简单的HTTP服务器
npx serve .
```

### 5. 添加调试日志
如果问题持续，我会添加更多调试日志来帮助诊断。

## 常见解决方案

### 方案1: 使用本地vis-timeline包
```bash
# 确保vis-timeline已安装
npm install vis-timeline

# 重启开发服务器
npm run dev
```

### 方案2: 检查防火墙和代理
- 确保能访问unpkg.com CDN
- 检查公司网络是否阻止了CDN访问
- 尝试使用其他CDN（如jsdelivr）

### 方案3: 离线模式
如果网络问题持续，可以下载vis-timeline到本地：

```bash
# 下载vis-timeline文件到public目录
wget https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js -O public/vis-timeline.min.js
```

然后修改HTML引用本地文件。

## 约束系统调试

如果vis-timeline加载成功但约束系统不工作：

### 1. 检查控制台日志
应该看到以下日志：
- "🚀 创建复杂软件开发项目案例"
- "✅ 复杂约束网络创建完成"
- "🔄 启动实时约束监控系统"

### 2. 测试拖拽功能
- 拖拽任意事务块
- 观察控制台是否有约束处理日志
- 检查其他事务是否自动调整

### 3. 验证约束状态
- 右侧面板应显示约束列表
- 约束状态应为"✓ 满足"或"✗ 不满足"

## 联系支持

如果问题仍然存在，请提供：
1. 浏览器类型和版本
2. 控制台完整错误信息
3. 网络环境描述
4. test-vis.html的测试结果

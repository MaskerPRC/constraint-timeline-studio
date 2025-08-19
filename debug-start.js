#!/usr/bin/env node

/**
 * 调试启动脚本
 * 添加详细日志来帮助诊断约束系统问题
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🔍 启动调试模式...')
console.log('📍 项目目录:', __dirname)
console.log('⏰ 启动时间:', new Date().toLocaleString())

// 设置环境变量启用详细日志
const env = {
  ...process.env,
  NODE_ENV: 'development',
  VITE_DEBUG: 'true',
  DEBUG: '*'
}

console.log('🚀 启动Vite开发服务器（调试模式）...')
console.log('📊 将显示详细的约束处理日志')
console.log('🔧 如果约束系统不工作，请查看浏览器控制台')

// 启动vite开发服务器
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: env,
  cwd: __dirname
})

viteProcess.on('error', (error) => {
  console.error('❌ 启动失败:', error.message)
  process.exit(1)
})

viteProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ 进程退出，代码: ${code}`)
  } else {
    console.log('👋 开发服务器已停止')
  }
})

// 处理Ctrl+C
process.on('SIGINT', () => {
  console.log('\n⏹️  正在停止开发服务器...')
  viteProcess.kill('SIGINT')
})

console.log('')
console.log('🎯 调试提示:')
console.log('1. 打开浏览器开发者工具')
console.log('2. 查看Console面板的约束处理日志')
console.log('3. 拖拽事务时观察约束系统日志输出')
console.log('4. 如果约束不生效，请查看错误信息')
console.log('')

#!/usr/bin/env node

/**
 * 开发环境快速设置脚本
 * 自动检查环境、安装依赖并启动开发服务器
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 时间区块调整工具 - 开发环境设置')
console.log('=====================================')

// 检查Node.js版本
function checkNodeVersion() {
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  
  console.log(`📋 检查Node.js版本: ${nodeVersion}`)
  
  if (majorVersion < 16) {
    console.error('❌ 错误: 需要Node.js 16.0.0或更高版本')
    console.error('请访问 https://nodejs.org 下载最新版本')
    process.exit(1)
  }
  
  console.log('✅ Node.js版本检查通过')
}

// 检查包管理器
function checkPackageManager() {
  try {
    execSync('npm --version', { stdio: 'ignore' })
    console.log('✅ npm可用')
    return 'npm'
  } catch (error) {
    try {
      execSync('yarn --version', { stdio: 'ignore' })
      console.log('✅ yarn可用')
      return 'yarn'
    } catch (error) {
      console.error('❌ 错误: 未找到npm或yarn包管理器')
      process.exit(1)
    }
  }
}

// 安装依赖
function installDependencies(packageManager) {
  console.log('\n📦 安装项目依赖...')
  
  const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'))
  
  if (nodeModulesExists) {
    console.log('📁 发现现有node_modules目录')
    const answer = require('readline-sync').question('是否重新安装依赖? (y/N): ')
    if (answer.toLowerCase() !== 'y') {
      console.log('⏭️  跳过依赖安装')
      return
    }
  }
  
  try {
    const installCommand = packageManager === 'yarn' ? 'yarn install' : 'npm install'
    console.log(`执行: ${installCommand}`)
    execSync(installCommand, { stdio: 'inherit' })
    console.log('✅ 依赖安装完成')
  } catch (error) {
    console.error('❌ 依赖安装失败:', error.message)
    process.exit(1)
  }
}

// 启动开发服务器
function startDevServer(packageManager) {
  console.log('\n🌟 启动开发服务器...')
  
  try {
    const devCommand = packageManager === 'yarn' ? 'yarn dev' : 'npm run dev'
    console.log(`执行: ${devCommand}`)
    console.log('🎉 开发服务器启动成功!')
    console.log('📱 应用将在浏览器中自动打开')
    console.log('🔧 修改代码将自动热重载')
    console.log('⏹️  按 Ctrl+C 停止服务器')
    
    execSync(devCommand, { stdio: 'inherit' })
  } catch (error) {
    if (error.signal === 'SIGINT') {
      console.log('\n👋 开发服务器已停止')
    } else {
      console.error('❌ 开发服务器启动失败:', error.message)
      process.exit(1)
    }
  }
}

// 主函数
function main() {
  try {
    checkNodeVersion()
    const packageManager = checkPackageManager()
    
    // 检查是否需要readline-sync（用于交互式安装）
    try {
      require('readline-sync')
    } catch (error) {
      console.log('📦 安装交互式工具...')
      execSync('npm install readline-sync', { stdio: 'inherit' })
    }
    
    installDependencies(packageManager)
    startDevServer(packageManager)
  } catch (error) {
    console.error('❌ 设置过程中发生错误:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

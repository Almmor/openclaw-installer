# OpenClaw Installer

🐾 **OpenClaw 一键安装器** - 简洁现代的桌面应用程序，帮助用户轻松安装和管理 OpenClaw 框架及其插件。

## ✨ 功能特点

### 🎨 界面设计
- **简洁现代风格**：采用扁平化设计，清爽的视觉体验
- **侧边栏导航**：首页、插件管理、设置、关于四个主要页面
- **响应式布局**：适配不同屏幕尺寸

### 🔧 核心功能

#### 1. OpenClaw 一键安装
- ✅ 自定义安装路径选择
- ✅ 实时安装进度显示
- ✅ 安装状态智能检测

#### 2. 插件管理
支持以下常用插件：

- 💬 **微信ChatBot**
  智能微信聊天机器人，支持自动回复、群管理等功能
  
- 📁 **文件管理器**
  强大的文件浏览和管理工具，支持批量操作
  
- ⏰ **任务调度器**
  定时任务和自动化工具，支持 Cron 表达式
  
- 📋 **日志查看器**
  系统日志和错误追踪工具，支持实时查看

#### 3. 便捷操作
- 📦 插件批量选择和一键安装
- 🔍 已安装/未安装状态筛选
- 🔗 插件详情查看（链接到 GitHub）
- 📂 安装目录快速打开

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm start
```

### 打包应用

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 📁 项目结构

```
openclaw-installer/
├── src/
│   ├── main.js          # Electron 主进程
│   ├── index.html       # 应用界面
│   ├── styles.css       # 样式文件
│   └── renderer.js      # 渲染进程逻辑
├── assets/              # 图标资源
├── package.json         # 项目配置
└── README.md            # 说明文档
```

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **HTML/CSS/JavaScript** - 前端技术
- **electron-builder** - 应用打包工具

## 📋 系统要求

- Windows 7+ / macOS 10.10+ / Ubuntu 18.04+
- Node.js >= 16.0
- npm >= 7.0

## 📦 下载应用

### Windows 安装版
下载 `OpenClaw Installer Setup 1.0.0.exe` 并运行安装向导

### Windows 便携版
下载 `OpenClaw Installer 1.0.0.exe` 直接运行，无需安装

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

© 2024 OpenClaw Team. All rights reserved.

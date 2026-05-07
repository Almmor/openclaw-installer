# OpenClaw Installer

![Build Status](https://github.com/Almmor/openclaw-installer/actions/workflows/build.yml/badge.svg)
![Release](https://img.shields.io/github/v/release/Almmor/openclaw-installer?include_prereleases&label=latest)
![License](https://img.shields.io/github/license/Almmor/openclaw-installer)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)

🐾 **OpenClaw 一键安装器** - 简洁现代的桌面应用程序，帮助用户轻松安装和管理 OpenClaw 框架及其插件。

## ✨ 功能特点

### 🎨 界面设计
- **简洁现代风格**：采用扁平化设计，清爽的视觉体验
- **侧边栏导航**：首页、管理、插件管理、设置、关于五个主要页面
- **原生窗口标题栏**：使用系统原生窗口控件
- **响应式布局**：适配不同屏幕尺寸

### 🔧 核心功能

#### 1. OpenClaw 一键安装
- ✅ 自定义安装路径选择
- ✅ 实时安装进度显示
- ✅ 安装状态智能检测
- ✅ 管理和卸载功能

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

## 📥 下载安装

### Windows
- [Windows 安装程序 (x64)](https://github.com/Almmor/openclaw-installer/releases/latest)
- [Windows 便携版 (x64)](https://github.com/Almmor/openclaw-installer/releases/latest)

### macOS
- [macOS DMG 安装包](https://github.com/Almmor/openclaw-installer/releases/latest)

### Linux
- [Linux AppImage](https://github.com/Almmor/openclaw-installer/releases/latest)

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
# 所有平台
npm run build:all

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
│   ├── icon.ico         # Windows 图标
│   ├── icon.png         # PNG 图标
│   └── icon.icns        # macOS 图标
├── .github/
│   └── workflows/
│       └── build.yml    # GitHub Actions 配置
├── package.json         # 项目配置
└── README.md            # 说明文档
```

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **HTML/CSS/JavaScript** - 前端技术
- **electron-builder** - 应用打包工具

## 📋 系统要求

- **Windows**: Windows 7+ (x64/x86)
- **macOS**: macOS 10.10+
- **Linux**: Ubuntu 18.04+ 或等效发行版
- **Node.js**: >= 16.0
- **npm**: >= 7.0

## 🔄 自动构建

该项目使用 GitHub Actions 进行自动化跨平台构建：

- ✅ **Windows**: NSIS 安装程序 + 便携版
- ✅ **macOS**: DMG 安装包
- ✅ **Linux**: AppImage

发布新版本时，只需创建一个新的 Git tag：

```bash
git tag v1.1.0
git push origin v1.1.0
```

GitHub Actions 会自动构建所有平台的安装包并创建 Release。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

© 2024 Almmor. All rights reserved.

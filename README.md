# Sonnet · 短视频解析工具

[![GitHub Stars](https://img.shields.io/github/stars/sukikeeling/Sonnet-Video?style=social)](https://github.com/sukikeeling/Sonnet-Video)
[![License](https://img.shields.io/github/license/sukikeeling/Sonnet-Video)](https://github.com/sukikeeling/Sonnet-Video/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-1.0-amber)](https://github.com/sukikeeling/Sonnet-Video)

[English](README_en.md) | [中文](#项目简介)

---

## 📋 目录

- [项目简介](#-项目简介)
- [技术栈](#-技术栈)
- [快速开始](#-快速开始)
- [功能说明](#-功能说明)
- [核心模块](#-核心模块)
- [开发指南](#-开发指南)
- [开源协议](#-开源协议)

---

## 🌟 项目简介

Sonnet 是一款简洁高效的在线资源解析工具。用户只需粘贴内容分享链接，即可获取原始画质的媒体文件，无需繁琐操作。

> 💡 本项目基于 [BK-SV v3.0](https://github.com/jiuhunwl/shortvideo-html)（作者 BugPk & JH-Ahua）二次开发，在保留核心解析能力的基础上，对 UI 和交互进行了全面重设计，并加入 Android 原生打包支持。

### ✨ 核心特点

| 特性 | 说明 |
|------|------|
| 🌐 广泛兼容 | 覆盖国内主流内容平台 |
| 🚀 原画获取 | 解析并获取无水印的原始媒体资源 |
| 🔓 简单免费 | 无需注册，打开即用 |
| 🎨 全新视觉 | 琥珀珊瑚暖色系，支持浅色/深色模式自动切换 |
| 🌍 多语言支持 | 中文、English |
| 📥 批量下载 | 支持打包下载多个资源，带实时进度 |
| 📱 原生 APK | 通过 Capacitor 构建 Android 原生应用 |

---

## 🛠️ 技术栈

| 分类 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3 | 渐进式 JavaScript 框架 |
| 构建工具 | Vite 6 | 下一代前端构建工具 |
| 状态管理 | Pinia 2 | Vue 官方状态管理库 |
| 样式框架 | Tailwind CSS 3 | 实用优先的 CSS 框架 |
| 移动端 | Capacitor 7 | 原生 Android 容器 |

---

## 🚀 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 18.0.0 | JavaScript 运行环境 |
| npm | >= 9.0.0 | 包管理器 |
| JDK | 21 | Android 构建所需 |
| Android SDK | 36 | Android 构建所需 |

### 安装与运行

```bash
# 安装依赖
npm install

# 开发模式（浏览器）
npm run dev
# 访问 http://localhost:5173

# 生产构建
npm run build

# 构建 Android APK（需提前配置 JDK 与 SDK）
cd android
./gradlew assembleDebug
```

---

## 🎯 功能说明

### 1. 📹 链接解析

```
粘贴链接 → 自动识别来源 → 点击解析 → 获取原始资源
```

- 支持粘贴主流内容平台的分享链接
- 自动识别来源，也可手动指定
- 一键解析，快速获取原始画质媒体

### 2. 🎨 主题系统

- 🌞 **浅色模式**：清爽明亮，适合白天
- 🌙 **深色模式**：护眼舒适，适合夜间
- ⏰ **自动切换**：根据系统时段（6:00-18:00）自动切换
- 👆 **手动切换**：导航栏一键切换

### 3. 🌍 多语言支持

| 语言 | 代码 | 切换方式 |
|------|------|----------|
| 中文 | zh-CN | 导航栏语言按钮 |
| English | en | 导航栏语言按钮 |

### 4. 📥 下载功能

| 功能 | 说明 |
|------|------|
| 📦 单文件下载 | 下载单个视频或图片文件 |
| 📁 批量打包 | 全部资源打包为 ZIP 下载 |
| 📊 实时进度 | 显示下载进度与速度 |
| ⏸️ 暂停/取消 | 支持暂停和取消下载任务 |

---

## 🧩 核心模块

### 状态管理

基于 Pinia，`src/stores/video.js` 管理全局状态：解析结果数据、下载任务列表、Toast 提示列表等。

### 按钮控制

内置节流控制、防重放保护、请求超时和自动重试机制，确保操作流畅稳定。

### 安全防护

- 防重放攻击（时间戳验证 + 签名生成）
- 请求频率限制

---

## 📝 开发指南

### 添加新平台支持

1. 在 `src/App.vue` 的 `PLATFORM_API_MAP` 中添加接口映射
2. 在组件中添加平台选项
3. 更新国际化翻译

### 添加新语言

1. 在 `src/composables/useI18n.js` 中添加翻译对象
2. 更新 `HeaderNav.vue` 语言切换按钮

### 代码规范

| 规范 | 说明 |
|------|------|
| 框架 | Vue 3 Composition API |
| 组件命名 | PascalCase（如 `HeaderNav.vue`） |
| 文件命名 | kebab-case（如 `use-button-control.js`） |

---

## 📄 开源协议

本项目基于 **MIT 协议** 开源。

```
MIT License

Copyright (c) 2024 BugPk & JH-Ahua（上游作者）
Copyright (c) 2025 Sonnet（二次开发）
```

> 上游项目 [BK-SV v3.0](https://github.com/jiuhunwl/shortvideo-html) 由 BugPk & JH-Ahua 开发，遵循 MIT 协议。本 fork 保留了原作者的署名与协议声明，同时进行了独立的 UI 重构、品牌重塑与 Android 原生打包扩展。

---

> 💝 如果这个项目对你有帮助，欢迎给上游项目 [BK-SV v3.0](https://github.com/jiuhunwl/shortvideo-html) 一个 ⭐
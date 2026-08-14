# Sonnet · Media Resource Parser

[![GitHub Stars](https://img.shields.io/github/stars/sukikeeling/Sonnet-Video?style=social)](https://github.com/sukikeeling/Sonnet-Video)
[![License](https://img.shields.io/github/license/sukikeeling/Sonnet-Video)](https://github.com/sukikeeling/Sonnet-Video/blob/main/LICENSE)
[![Version](https://img.shields.io/badge/version-1.0-amber)](https://github.com/sukikeeling/Sonnet-Video)

[中文](README.md) | [English](#project-overview)

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Core Modules](#-core-modules)
- [Development Guide](#-development-guide)
- [License](#-license)

---

## 🌟 Project Overview

Sonnet is a clean and efficient online media resource parser. Simply paste a share link to retrieve original-quality media files with no watermark. No registration required.

> 💡 This project is a fork of [BK-SV v3.0](https://github.com/jiuhunwl/shortvideo-html) by BugPk & JH-Ahua. It retains the core parsing capability while delivering a complete UI redesign, brand refresh, and native Android APK support via Capacitor.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌐 Wide Compatibility | Works with major content platforms |
| 🚀 Original Quality | Retrieve watermark-free media files |
| 🔓 Free & Simple | No registration, use directly |
| 🎨 Fresh Look | Warm amber-coral palette, light/dark mode |
| 🌍 Multi-language | Chinese, English |
| 📥 Batch Download | Pack and download with live progress |
| 📱 Native APK | Android app via Capacitor |

---

## 🛠️ Tech Stack

| Category | Technology | Description |
|----------|------------|-------------|
| Framework | Vue 3 | Progressive JavaScript framework |
| Build Tool | Vite 6 | Next-gen frontend tooling |
| State Mgmt | Pinia 2 | Vue official state management |
| CSS | Tailwind CSS 3 | Utility-first CSS framework |
| Mobile | Capacitor 7 | Native Android container |

---

## 🚀 Quick Start

### Prerequisites

| Dependency | Version | Note |
|------------|---------|------|
| Node.js | >= 18.0.0 | JavaScript runtime |
| npm | >= 9.0.0 | Package manager |
| JDK | 21 | Required for Android build |
| Android SDK | 36 | Required for Android build |

### Install & Run

```bash
# Install dependencies
npm install

# Development mode (browser)
npm run dev
# Visit http://localhost:5173

# Production build
npm run build

# Build Android APK (JDK & SDK required)
cd android
./gradlew assembleDebug
```

---

## 🎯 Features

### 1. 📹 Link Parsing

```
Paste link → Auto-detect source → Click parse → Get original media
```

- Paste share links from major content platforms
- Auto-detect source, or select manually
- One-click to retrieve original-quality media

### 2. 🎨 Theme System

- 🌞 **Light Mode**: Bright and fresh
- 🌙 **Dark Mode**: Easy on the eyes
- ⏰ **Auto Switch**: Based on time of day (6:00-18:00)
- 👆 **Manual Toggle**: One-tap in navbar

### 3. 🌍 Multi-language

| Language | Code |
|----------|------|
| Chinese | zh-CN |
| English | en |

### 4. 📥 Download

| Feature | Description |
|---------|-------------|
| 📦 Single File | Download video or image |
| 📁 Batch ZIP | Package all as ZIP |
| 📊 Live Progress | Speed and percentage |
| ⏸️ Pause/Cancel | Cancel anytime |

---

## 🧩 Core Modules

### State Management

Powered by Pinia, `src/stores/video.js` manages global state: parsing results, download tasks, toast notifications, and more.

### Button Control

Built-in throttling, anti-replay, request timeout, and auto-retry for smooth operation.

### Security

- Anti-replay (timestamp validation + signature)
- Rate limiting

---

## 📝 Development Guide

### Adding a New Platform

1. Add API mapping in `PLATFORM_API_MAP` in `src/App.vue`
2. Add platform options in components
3. Update i18n translations

### Adding a New Language

1. Add translation object in `src/composables/useI18n.js`
2. Update language toggle in `HeaderNav.vue`

### Code Standards

| Standard | Description |
|----------|-------------|
| Framework | Vue 3 Composition API |
| Components | PascalCase (e.g. `HeaderNav.vue`) |
| Files | kebab-case (e.g. `use-button-control.js`) |

---

## 📄 License

This project is open source under the **MIT License**.

```
MIT License

Copyright (c) 2024 BugPk & JH-Ahua (upstream authors)
Copyright (c) 2025 Sonnet (fork & redesign)
```

> Upstream project: [BK-SV v3.0](https://github.com/jiuhunwl/shortvideo-html) by BugPk & JH-Ahua. This fork preserves the original authors' attribution and license while delivering independent UI/UX redesign, brand refresh, and Android native packaging.

---

> 💝 If you find this project helpful, consider starring the upstream project [BK-SV v3.0](https://github.com/jiuhunwl/shortvideo-html) ⭐
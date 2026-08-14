# Sonnet Video · Media Resource Parser

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

Sonnet Video is a clean and efficient online media resource parser. Simply paste a share link to retrieve original-quality media files with no watermark. No registration required.

> 💡 This project is a fork of [BK-SV v3.0](https://github.com/jiuhunwl/shortvideo-html) by BugPk & JH-Ahua. It retains the core parsing capability while delivering a complete UI redesign, brand refresh, and native Android APK support via Capacitor.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🌐 Wide Compatibility | Works with major content platforms |
| 🚀 Original Quality | Retrieve watermark-free media files |
| 🔓 Free & Simple | No registration, use directly |
| 🎨 Fresh Look | Warm amber-coral palette, light/dark mode |
| 🌍 Multi-language | Chinese, English |
| 📥 Batch Download | Download all as individual original-format files concurrently (no ZIP), with live progress |
| 📱 Native APK | Android app via Capacitor |

---

## 🛠️ Tech Stack

| Category | Technology | Description |
|----------|------------|-------------|
| Framework | Vue 3 | Progressive JavaScript framework |
| Build Tool | Vite 5 | Next-gen frontend tooling |
| State Mgmt | Pinia 2 | Vue official state management |
| CSS | Tailwind CSS 3 | Utility-first CSS framework |
| Mobile | Capacitor 8 | Native Android container |

---

## 🚀 Quick Start

### Prerequisites

| Dependency | Version | Note |
|------------|---------|------|
| Node.js | >= 18.0.0 | JavaScript runtime |
| npm | >= 9.0.0 | Package manager |
| JDK | **21+** | Required for Android build (Kotlin 2.2.20; JDK 17 fails with "invalid source release: 21") |
| Android SDK | compileSdk 36 / targetSdk 36 / minSdk 24 | Required for Android build |

### Install & Build (full reproduction steps)

> ⚠️ `android/app/src/main/assets/` (Capacitor sync output) is **NOT committed**. After cloning you MUST run steps 1-4 below in order — running gradlew directly fails due to missing web assets.

```bash
# 1. Install dependencies
npm install

# 2. Production build (generates dist/)
npm run build

# 3. Sync web assets into the Android project (critical; generates android/app/src/main/assets/public/)
npx cap sync android

# 4. Build the APK
cd android
./gradlew assembleDebug

# APK output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Machine-specific committed config (adjust after cloning)

| File | Content | Note |
|------|---------|------|
| `android/gradle.properties` | `org.gradle.java.home=D\:/jdk21/jdk-21.0.12+8` | **Must change** to your own JDK 21 path |
| `android/gradle.properties` | `systemProp.http(s).proxyHost=127.0.0.1` / `proxyPort=10809` | Author's local proxy; remove these 4 lines if you have no proxy |
| `android/local.properties` | `sdk.dir=D\:\\android-sdk` | **Not committed**; create it pointing to your SDK (or set `ANDROID_HOME`) |
| `android/build.gradle` | Aliyun maven mirror first | Configured for CN networks; can be removed elsewhere |

### Development mode (browser)

```bash
npm run dev
# Visit http://localhost:5173
```

> Parsing depends on the third-party service `api.bugpk.com` (see `PLATFORM_API_MAP` in `src/App.vue`); replace it if the service goes down.

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
| 📦 Single File | Download a single video/image/live file; each gallery image has its own download button |
| 📁 Batch | All resources downloaded **concurrently as individual original-format files** (webp/png/jpg/mp4), saved to `Documents/sonnet/` — no ZIP, no unzip needed |
| 📊 Live Progress | Speed and percentage per task |
| ⏹️ Cancel | Cancel a download anytime |

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
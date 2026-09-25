<script setup>
defineProps({ locale: String })

const content = {
  'zh-CN': {
    brand: 'Sonnet',
    version: 'v1.0',
    desc: '简洁高效的短视频解析工具，支持多平台无水印视频与图集解析。',
    quickLinks: '快速链接',
    home: '首页', course: '使用教程', platforms: '支持平台',
    help: '帮助与支持',
    faq: '常见问题', about: '关于我们',
    contact: '联系我们',
    copyright: 'Sonnet · 保留所有权利',
    starUs: 'GitHub',
    issues: '问题反馈'
  },
  'en': {
    brand: 'Sonnet',
    version: 'v1.0',
    desc: 'Simple & easy video parsing tool. Support multi-platform watermark-free video & album extraction.',
    quickLinks: 'Quick Links',
    home: 'Home', course: 'Tutorial', platforms: 'Platforms',
    help: 'Help & Support',
    faq: 'FAQ', about: 'About',
    contact: 'Contact Us',
    copyright: 'Sonnet · All Rights Reserved',
    starUs: 'GitHub',
    issues: 'Report Issues'
  }
}

const getContent = (locale) => content[locale] || content['zh-CN']

// 仅保留自有仓库入口，移除了原项目附带的站外推广（Demo 站 / 联系邮箱）
const socialLinks = [
  { icon: 'fab fa-github', url: 'https://github.com/sukikeeling/BK-SV-v3.0-Personal', label: 'GitHub', color: '#333' },
]
</script>

<template>
  <footer id="ours" class="relative overflow-hidden scroll-mt-16 border-t border-[var(--c-border)] bg-gradient-to-b from-transparent via-[var(--c-bg-elevated)]/50 to-[var(--c-bg-elevated)] dark:via-[var(--c-bg-elevated)]/30 dark:to-[var(--c-bg-elevated)]">
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[120px] bg-gradient-radial from-amber-400/5 to-transparent pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-4 py-10 md:py-16 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-pink-400 shadow-lg shadow-amber-500/20">
              <svg viewBox="0 0 24 24" class="w-7 h-7 text-white" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 3L2 21h20L12 3z" stroke-linejoin="round"/>
                <path d="M12 3v18" stroke-linecap="round"/>
                <path d="M8 9l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h4 class="font-bold text-lg text-[var(--c-fg)]">{{ getContent(locale).brand }}</h4>
              <p class="text-xs text-[var(--c-fg-3)]">{{ getContent(locale).version }}</p>
            </div>
          </div>
          <p class="text-sm text-[var(--c-fg-2)] leading-relaxed mb-5">{{ getContent(locale).desc }}</p>
          <div class="flex items-center gap-3">
            <a
              v-for="social in socialLinks"
              :key="social.label"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--c-bg-elevated)] text-[var(--c-fg-2)] hover:bg-gradient-to-br hover:from-amber-400 hover:to-pink-400 hover:text-white transition-all duration-200"
              :aria-label="social.label"
            >
              <i :class="[social.icon]"></i>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div>
          <h5 class="font-semibold text-sm text-[var(--c-fg)] mb-4 flex items-center gap-2">
            <i class="fas fa-link text-amber-500"></i>
            {{ getContent(locale).quickLinks }}
          </h5>
          <ul class="space-y-3">
            <li><a href="/" class="text-sm text-[var(--c-fg-2)] hover:text-amber-500 transition-colors flex items-center gap-2" @click.prevent="window.scrollTo({top:0,behavior:'smooth'})"><i class="fas fa-home text-xs"></i>{{ getContent(locale).home }}</a></li>
            <li><a href="#course" class="text-sm text-[var(--c-fg-2)] hover:text-amber-500 transition-colors flex items-center gap-2"><i class="fas fa-book text-xs"></i>{{ getContent(locale).course }}</a></li>
            <li><a href="#Supported_Platforms" class="text-sm text-[var(--c-fg-2)] hover:text-amber-500 transition-colors flex items-center gap-2"><i class="fas fa-th text-xs"></i>{{ getContent(locale).platforms }}</a></li>
          </ul>
        </div>

        <!-- Help -->
        <div>
          <h5 class="font-semibold text-sm text-[var(--c-fg)] mb-4 flex items-center gap-2">
            <i class="fas fa-question-circle text-pink-500"></i>
            {{ getContent(locale).help }}
          </h5>
          <ul class="space-y-3">
            <li><a href="#faq" class="text-sm text-[var(--c-fg-2)] hover:text-amber-500 transition-colors flex items-center gap-2"><i class="fas fa-comments text-xs"></i>{{ getContent(locale).faq }}</a></li>
            <li><a href="#ours" class="text-sm text-[var(--c-fg-2)] hover:text-amber-500 transition-colors flex items-center gap-2"><i class="fas fa-info-circle text-xs"></i>{{ getContent(locale).about }}</a></li>
            <li><a :href="socialLinks[0].url" target="_blank" rel="noopener noreferrer" class="text-sm text-[var(--c-fg-2)] hover:text-amber-500 transition-colors flex items-center gap-2"><i class="fab fa-github text-xs"></i>{{ getContent(locale).issues }}</a></li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h5 class="font-semibold text-sm text-[var(--c-fg)] mb-4 flex items-center gap-2">
            <i class="fas fa-id-card text-amber-500"></i>
            {{ getContent(locale).contact }}
          </h5>
          <ul class="space-y-3">
            <li><a :href="socialLinks[0].url" target="_blank" rel="noopener noreferrer" class="text-sm text-[var(--c-fg-2)] hover:text-amber-500 transition-colors flex items-center gap-2"><i class="fab fa-github text-xs"></i><span class="truncate">Sonnet Video 项目主页</span></a></li>
            <li class="flex items-center gap-2 text-sm text-[var(--c-fg-2)]"><i class="fas fa-shield-halved text-xs text-emerald-400"></i><span>多线路解析 · 无广告</span></li>
          </ul>
          <div class="mt-5">
            <a
              :href="socialLinks[0].url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--c-fg)] text-[var(--c-bg)] text-sm font-medium hover:bg-gradient-to-r hover:from-amber-500 hover:to-pink-500 hover:text-white transition-all duration-200"
            >
              <i class="fab fa-github"></i>
              <span>{{ getContent(locale).starUs }}</span>
            </a>
          </div>
        </div>
      </div>

      <div class="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"></div>

      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-center">
        <p class="text-sm text-[var(--c-fg-3)]">{{ getContent(locale).copyright }}</p>
        <p class="text-sm text-[var(--c-fg-3)]">Made with <i class="fas fa-heart text-pink-400 mx-0.5"></i> by Sonnet</p>
      </div>
    </div>
  </footer>
</template>
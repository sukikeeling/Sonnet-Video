<script setup>
import { computed } from 'vue'
import { useVideoStore } from '../stores/video'

const props = defineProps({
  inputUrl: String,
  isLoading: Boolean,
  isError: Boolean,
  parseError: String,
  locale: String,
  currentPlatform: String
})

const emit = defineEmits(['update:inputUrl', 'parse', 'select-platform'])

const videoStore = useVideoStore()

const content = {
  'zh-CN': {
    badge: 'Sonnet · 多平台无水印解析',
    title1: '轻松解析',
    title2: '任何',
    title3: '短视频',
    desc: '支持抖音、快手、B站、小红书等主流平台，一键提取无水印视频与图集，简单免费。',
    inputLabel: '视频链接',
    placeholder: '粘贴分享链接或含链接的文本…',
    button: '开始解析',
    loading: '正在解析…',
    error: '重新解析',
    errorTitle: '解析没有完成',
    errorHint: '请检查作品是否公开可访问，或切换平台后再试一次。',
    features: [
      { icon: 'fa-check-circle', color: 'text-emerald-500', label: '无水印' },
      { icon: 'fa-bolt', color: 'text-amber-500', label: '高速解析' },
      { icon: 'fa-gift', color: 'text-pink-500', label: '完全免费' }
    ]
  },
  'en': {
    badge: 'Sonnet · Multi-Platform Parser',
    title1: 'Parse ',
    title2: 'Any',
    title3: ' Short Video',
    desc: 'Support Douyin, Kuaishou, Bilibili, Xiaohongshu and more. Extract videos & albums without watermark, simple and free.',
    inputLabel: 'Video URL',
    placeholder: 'Paste a share link or text containing a link…',
    button: 'Start Parsing',
    loading: 'Parsing…',
    error: 'Retry',
    errorTitle: 'Parsing did not finish',
    errorHint: 'Check that the post is public, or switch platform and try again.',
    features: [
      { icon: 'fa-check-circle', color: 'text-emerald-500', label: 'No Watermark' },
      { icon: 'fa-bolt', color: 'text-amber-500', label: 'Fast Parse' },
      { icon: 'fa-gift', color: 'text-pink-500', label: 'Free' }
    ]
  }
}

const getContent = (locale) => content[locale] || content['zh-CN']
const hasParseError = computed(() => Boolean(props.parseError))

const platformTabs = {
  'zh-CN': [
    { key: 'all', label: '所有', icon: 'fa-globe' },
    { key: 'douyin', label: '抖音', icon: 'fa-music' },
    { key: 'kuaishou', label: '快手', icon: 'fa-bolt' },
    { key: 'bilibili', label: 'B站', icon: 'fa-play-circle' },
    { key: 'xhs', label: '小红书', icon: 'fa-bookmark' }
  ],
  'en': [
    { key: 'all', label: 'All', icon: 'fa-globe' },
    { key: 'douyin', label: 'Douyin', icon: 'fa-music' },
    { key: 'kuaishou', label: 'Kuaishou', icon: 'fa-bolt' },
    { key: 'bilibili', label: 'Bilibili', icon: 'fa-play-circle' },
    { key: 'xhs', label: 'Xiaohongshu', icon: 'fa-bookmark' }
  ]
}

const getPlatformTabs = (locale) => platformTabs[locale] || platformTabs['zh-CN']

const selectPlatform = (key) => emit('select-platform', key)
</script>

<template>
  <section class="relative text-center py-6 sm:py-10 lg:py-14 overflow-hidden">
    <!-- Warm gradient orbs -->
    <div class="absolute inset-0 -z-10 pointer-events-none">
      <div class="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-radial from-amber-400/10 via-amber-300/5 to-transparent rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-pink-400/10 via-pink-300/5 to-transparent rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-pink-50 dark:from-amber-950/30 dark:to-pink-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-in">
        <i class="fas fa-sparkles text-amber-400"></i>
        <span>{{ getContent(locale).badge }}</span>
      </div>

      <!-- Title -->
      <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 tracking-tight animate-slide-up" style="animation-delay: 100ms">
        <span class="gradient-text">{{ getContent(locale).title1 }}</span>
        <span class="text-[var(--c-fg)]">{{ getContent(locale).title2 }}</span>
        <span class="gradient-text">{{ getContent(locale).title3 }}</span>
      </h2>

      <!-- Description -->
      <p class="text-base sm:text-lg text-[var(--c-fg-2)] max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-slide-up" style="animation-delay: 200ms">
        {{ getContent(locale).desc }}
      </p>

      <!-- Features -->
      <div class="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 animate-slide-up" style="animation-delay: 300ms">
        <div
          v-for="(feature, index) in getContent(locale).features"
          :key="index"
          class="flex items-center gap-2 text-sm sm:text-base text-[var(--c-fg-2)]"
        >
          <i :class="['fas', feature.icon, feature.color]"></i>
          <span>{{ feature.label }}</span>
        </div>
      </div>

      <!-- Input Area -->
      <div class="max-w-xl sm:max-w-2xl mx-auto animate-slide-up" style="animation-delay: 400ms">
        <!-- Platform Tabs -->
        <div class="flex flex-wrap justify-center gap-2 mb-4">
          <button
            v-for="tab in getPlatformTabs(locale)"
            :key="tab.key"
            @click="selectPlatform(tab.key)"
            :class="[
              'px-3 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5',
              currentPlatform === tab.key
                ? 'bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg shadow-amber-500/25'
                : 'bg-[var(--c-bg-elevated)] text-[var(--c-fg-2)] hover:text-amber-500 border border-[var(--c-border)] hover:border-amber-400'
            ]"
          >
            <i :class="['fas', tab.icon]"></i>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative group">
          <div class="absolute -inset-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
          <div class="relative flex items-center glass-card overflow-hidden transition-all duration-300 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-500/10">
            <input
              :value="inputUrl"
              @input="emit('update:inputUrl', $event.target.value)"
              @keyup.enter="emit('parse')"
              type="text"
              :placeholder="getContent(locale).placeholder"
              class="flex-1 px-4 sm:px-6 py-4 sm:py-5 bg-transparent text-[var(--c-fg)] text-sm sm:text-base placeholder:text-[var(--c-fg-3)] outline-none"
              :disabled="isLoading"
            />
            <button
              @click="emit('parse')"
              :disabled="isLoading"
              class="m-1 sm:m-1.5 px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 whitespace-nowrap"
              :class="isLoading
                ? 'bg-[var(--c-fg-3)] cursor-not-allowed opacity-60 text-white'
                : isError
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-0.5'
                  : 'bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5'"
            >
              <i :class="['fas text-xs sm:text-sm transition-all', isLoading ? 'fa-spinner fa-spin' : isError ? 'fa-exclamation-circle' : 'fa-bolt']"></i>
              <span class="hidden sm:inline text-sm">{{ isLoading ? getContent(locale).loading : isError ? getContent(locale).error : getContent(locale).button }}</span>
              <span class="sm:hidden text-sm">{{ isLoading ? '...' : isError ? '!' : '>' }}</span>
            </button>
          </div>
        </div>

        <!-- Error Panel -->
        <Transition name="parse-error">
          <div
            v-if="hasParseError"
            class="parse-error-panel"
            role="alert"
            aria-live="assertive"
          >
            <div class="parse-error-icon">
              <i class="fas fa-circle-exclamation"></i>
            </div>
            <div class="parse-error-copy">
              <p class="parse-error-title">{{ getContent(locale).errorTitle }}</p>
              <p class="parse-error-message">{{ parseError }}</p>
              <p class="parse-error-hint">{{ getContent(locale).errorHint }}</p>
            </div>
          </div>
        </Transition>

        <div class="flex items-center justify-between mt-3 px-1 flex-wrap gap-2">
          <p class="text-xs text-[var(--c-fg-3)] text-left">
            <i class="fas fa-info-circle mr-1 text-amber-400"></i>
            {{ locale === 'zh-CN' ? '支持抖音、快手、B站、小红书等平台' : 'Support Douyin, Kuaishou, Bilibili, Xiaohongshu & more' }}
          </p>

          <button
            @click="videoStore.openHistory()"
            type="button"
            class="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1.5 py-1 px-3 rounded-full bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all font-medium border border-amber-500/20"
          >
            <i class="fas fa-clock-rotate-left text-[11px]"></i>
            <span>解析记录</span>
            <span v-if="videoStore.historyList.length > 0" class="font-bold">({{ videoStore.historyList.length }})</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.bg-gradient-radial {
  background: radial-gradient(circle, var(--tw-gradient-stops));
}

.parse-error-panel {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 0.875rem;
  padding: 0.875rem 1rem;
  border: 1px solid rgba(244, 63, 94, 0.24);
  border-radius: 1rem;
  background: rgba(255, 241, 242, 0.92);
  color: #881337;
  text-align: left;
  box-shadow: 0 14px 32px rgba(225, 29, 72, 0.1);
}

:global(.dark) .parse-error-panel {
  border-color: rgba(251, 113, 133, 0.26);
  background: rgba(76, 5, 25, 0.56);
  color: #fecdd3;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.22);
}

.parse-error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex: 0 0 2rem;
  border-radius: 999px;
  background: rgba(244, 63, 94, 0.12);
  color: #e11d48;
}

:global(.dark) .parse-error-icon {
  background: rgba(251, 113, 133, 0.16);
  color: #fb7185;
}

.parse-error-copy { min-width: 0; }
.parse-error-title { margin: 0; font-size: 0.875rem; font-weight: 700; line-height: 1.35; }
.parse-error-message { margin: 0.25rem 0 0; font-size: 0.8125rem; line-height: 1.5; word-break: break-word; }
.parse-error-hint { margin: 0.375rem 0 0; font-size: 0.75rem; line-height: 1.45; color: rgba(136, 19, 55, 0.72); }
:global(.dark) .parse-error-hint { color: rgba(254, 205, 211, 0.72); }

.parse-error-enter-active,
.parse-error-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.parse-error-enter-from,
.parse-error-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
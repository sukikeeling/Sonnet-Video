<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({
  isDark: Boolean,
  locale: String
})

const emit = defineEmits(['toggle-theme', 'set-locale'])

const isMobileMenuOpen = ref(false)
const scrollProgress = ref(0)

const updateScrollProgress = () => {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  scrollProgress.value = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0
}

onMounted(() => {
  window.addEventListener('scroll', updateScrollProgress, { passive: true })
  updateScrollProgress()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollProgress)
})

const navLinks = [
  { href: '/', labelKey: 'nav.home' },
  { href: '#Supported_Platforms', labelKey: 'nav.platforms' },
  { href: '#course', labelKey: 'nav.course' },
  { href: '#faq', labelKey: 'nav.faq' },
  { href: '#ours', labelKey: 'nav.about' }
]

const labels = {
  'zh-CN': { brand: 'Sonnet', subtitle: '无水印解析', home: '首页', course: '教程', platforms: '平台', faq: '常见问题', about: '关于', menu: '菜单', close: '关闭' },
  'en': { brand: 'Sonnet', subtitle: 'No Watermark', home: 'Home', course: 'Tutorial', platforms: 'Platforms', faq: 'FAQ', about: 'About', menu: 'Menu', close: 'Close' }
}

const getLabel = (locale, key) => labels[locale]?.[key] || labels['zh-CN'][key]

const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value }
const closeMobileMenu = () => { isMobileMenuOpen.value = false }

const handleNavClick = (href) => {
  closeMobileMenu()
  if (href === '/') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else if (href && href.startsWith('#')) {
    setTimeout(() => {
      const element = document.querySelector(href)
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') closeMobileMenu()
}
</script>

<template>
  <header
    class="glass sticky top-0 z-50 border-b border-[var(--c-border)] transition-all duration-300"
    role="banner"
  >
    <!-- Scroll Progress Bar -->
    <div class="absolute top-0 left-0 right-0 h-0.5 bg-[var(--c-border)] overflow-hidden">
      <div
        class="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-pink-400 transition-all duration-150 ease-out"
        :style="{ width: scrollProgress + '%' }"
      ></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 sm:h-18">
        <!-- Logo -->
        <a
          href="/"
          class="flex items-center gap-3 group"
          aria-label="Sonnet 短视频解析"
        >
          <!-- Sonnet Logo SVG -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-pink-400 shadow-lg shadow-amber-500/20">
            <svg viewBox="0 0 24 24" class="w-6 h-6 text-white" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3L2 21h20L12 3z" stroke-linejoin="round"/>
              <path d="M12 3v18" stroke-linecap="round"/>
              <path d="M8 9l4 4 4-4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="hidden xs:block">
            <h1 class="font-bold text-lg text-[var(--c-fg)] tracking-tight">
              {{ getLabel(locale, 'brand') }}
            </h1>
            <p class="text-xs text-[var(--c-fg-3)]">
              {{ getLabel(locale, 'subtitle') }}
            </p>
          </div>
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="px-4 py-2 text-sm font-medium text-[var(--c-fg-2)] hover:text-amber-500 dark:hover:text-amber-400 rounded-lg hover:bg-[var(--c-bg-elevated)] transition-all duration-200"
            @click.prevent="handleNavClick(link.href)"
          >
            {{ getLabel(locale, link.labelKey.split('.')[1]) }}
          </a>
        </nav>

        <!-- Controls -->
        <div class="flex items-center gap-2 sm:gap-3">
          <div class="relative">
            <select
              :value="locale"
              @change="emit('set-locale', $event.target.value)"
              class="appearance-none text-sm pl-3 pr-8 py-1.5 rounded-lg bg-[var(--c-bg-elevated)] text-[var(--c-fg-2)] border border-[var(--c-border)] cursor-pointer outline-none focus:ring-2 focus:ring-amber-500/30 transition-all duration-200 hover:border-amber-400"
              aria-label="Select language"
            >
              <option value="zh-CN">中文</option>
              <option value="en">EN</option>
            </select>
            <i class="fas fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--c-fg-3)] pointer-events-none"></i>
          </div>

          <button
            @click="emit('toggle-theme')"
            class="p-2 rounded-lg text-[var(--c-fg-2)] hover:bg-[var(--c-bg-elevated)] hover:text-amber-500 transition-all duration-200"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <i :class="['fas text-sm transition-all duration-300', isDark ? 'fa-sun text-amber-400' : 'fa-moon']"></i>
          </button>

          <button
            @click="toggleMobileMenu"
            class="md:hidden p-2 rounded-lg text-[var(--c-fg-2)] hover:bg-[var(--c-bg-elevated)] transition-all duration-200"
            :aria-expanded="isMobileMenuOpen"
            aria-controls="mobile-menu"
            :aria-label="getLabel(locale, isMobileMenuOpen ? 'close' : 'menu')"
          >
            <i :class="['fas text-sm transition-transform duration-300', isMobileMenuOpen ? 'fa-times' : 'fa-bars']"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        id="mobile-menu"
        class="md:hidden border-t border-[var(--c-border)] glass"
        @keydown="handleKeydown"
      >
        <nav class="px-4 py-3 space-y-1" role="navigation" aria-label="Mobile navigation">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            @click.prevent="handleNavClick(link.href)"
            class="block px-4 py-3 text-sm font-medium text-[var(--c-fg-2)] rounded-lg hover:bg-[var(--c-bg-elevated)] hover:text-amber-500 transition-colors duration-200"
          >
            {{ getLabel(locale, link.labelKey.split('.')[1]) }}
          </a>
        </nav>
      </div>
    </Transition>
  </header>
</template>
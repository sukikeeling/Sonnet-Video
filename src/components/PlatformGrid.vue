<script setup>
import { ref } from 'vue'

defineProps({ locale: String })
defineEmits(['platform-click'])

const isPaused = ref(false)
const handleTouchStart = () => { isPaused.value = true }
const handleTouchEnd = () => { isPaused.value = false }

const content = {
  'zh-CN': { badge: '支持平台', title: '' },
  'en': { badge: 'Supported Platforms', title: '' }
}
const getContent = (locale) => content[locale] || content['zh-CN']

const allPlatforms = [
  { name: '抖音', url: 'https://www.douyin.com', desc: '解析抖音无水印视频', gradient: 'from-slate-900 to-slate-700', img: 'https://lf-douyin-pc-web.douyinstatic.com/obj/douyin-pc-web/2025_0313_logo.png', color: '#fe2c55' },
  { name: '快手', url: 'https://www.kuaishou.com', desc: '解析快手无水印视频', gradient: 'from-red-500 to-amber-400', img: 'https://p4-plat.wskwai.com/kos/nlav111422/ks-web/favicon.ico', color: '#ff4906' },
  { name: 'B站', url: 'https://www.bilibili.com', desc: '解析B站视频', gradient: 'from-sky-500 to-violet-500', img: 'https://www.bilibili.com/favicon.ico', color: '#00a1d6' },
  { name: '小红书', url: 'https://www.xiaohongshu.com', desc: '解析小红书视频', gradient: 'from-rose-500 to-red-500', img: 'https://www.xiaohongshu.com/favicon.ico', color: '#fe2c55' },
  { name: '微博', url: 'https://weibo.com', desc: '解析微博短视频', gradient: 'from-orange-500 to-amber-400', img: 'https://weibo.com/favicon.ico', color: '#e6162d' },
  { name: '微视', url: 'https://weishi.qq.com', desc: '解析微视短视频', gradient: 'from-blue-600 to-cyan-400', img: 'https://isee.weishi.qq.com/favicon.ico', color: '#3a7fff' },
  { name: '皮皮虾', url: 'https://www.pipix.com', desc: '解析皮皮虾视频', gradient: 'from-purple-600 to-pink-500', img: 'https://lf-toutiao-ug-dns.toutiaocdn.com/obj/toutiao-ug-tos/ppx/mp/static/media/favicon.9cfbabbf.ico', color: '#ffc700' },
  { name: '皮皮搞笑', url: 'https://www.pipigx.com', desc: '解析搞笑短视频', gradient: 'from-green-600 to-lime-400', img: 'https://www.pipigx.com/favicon.ico', color: '#25d68a' },
  { name: '西瓜视频', url: 'https://www.ixigua.com', desc: '解析西瓜短视频', gradient: 'from-emerald-600 to-teal-500', img: 'https://www.ixigua.com/favicon.ico', color: '#fe2c55' },
  { name: '好看视频', url: 'https://haokan.baidu.com', desc: '解析百度系短视频', gradient: 'from-blue-800 to-sky-400', img: 'https://haokan.baidu.com/favicon.ico', color: '#3a7fff' },
  { name: '最右', url: 'https://www.izuiyou.com', desc: '解析最右短视频', gradient: 'from-purple-800 to-fuchsia-500', img: 'https://www.izuiyou.com/favicon.ico', color: '#8854d0' },
  { name: '火山小视频', url: 'https://www.huoshan.com', desc: '解析火山平台视频', gradient: 'from-orange-800 to-amber-500', img: 'https://sj-fd.zol-img.com.cn/t_s180x180/g2/M00/09/0A/ChMlWl5TM3qIEGKDAACLMVr64W0AANcDwHGiFgAAItJ628.png', color: '#ff6e27' },
]

const platformDescs = {
  'zh-CN': ['解析抖音无水印视频','解析快手无水印视频','解析B站视频','解析小红书视频','解析微博短视频','解析微视短视频','解析皮皮虾视频','解析搞笑短视频','解析西瓜短视频','解析百度系短视频','解析最右短视频','解析火山平台视频'],
  'en': ['Parse Douyin videos','Parse Kuaishou videos','Parse Bilibili videos','Parse Xiaohongshu videos','Parse Weibo videos','Parse Weishi videos','Parse Pipixia videos','Parse Funny videos','Parse Xigua videos','Parse Baidu videos','Parse Zuiyou videos','Parse Huoshan videos']
}

const getDesc = (locale, idx) => (platformDescs[locale] || platformDescs['zh-CN'])[idx]
const duplicatedPlatforms = [...allPlatforms, ...allPlatforms]
</script>

<template>
  <section id="Supported_Platforms" class="mb-16 overflow-hidden scroll-mt-16">
    <div class="flex items-center justify-center py-6">
      <h3 class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-pink-50 dark:from-amber-950/30 dark:to-pink-950/30 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 text-sm font-medium">
        <i class="fas fa-grid-2 text-xs"></i>
        {{ getContent(locale).badge }}
      </h3>
    </div>

    <div class="relative">
      <div class="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--c-bg)] to-transparent z-10 pointer-events-none"></div>
      <div class="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--c-bg)] to-transparent z-10 pointer-events-none"></div>

      <div
        class="overflow-hidden py-6"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >
        <div
          class="flex gap-4 animate-marquee"
          :class="{ 'animation-play-state-paused': isPaused }"
        >
          <!-- 不再跳转站外：平台卡片改为纯展示，避免用户被带离 App -->
          <div
            v-for="(platform, idx) in duplicatedPlatforms"
            :key="`p-${idx}`"
            class="platform-card"
            :aria-label="`${platform.name}: ${getDesc(locale, idx % allPlatforms.length)}`"
          >
            <div class="platform-icon-container">
              <div :class="['platform-icon-wrapper', 'bg-gradient-to-br', platform.gradient]">
                <img :src="platform.img" :alt="platform.name" class="platform-icon-img" loading="lazy">
              </div>
              <div class="platform-glow" :style="{ background: platform.color }"></div>
            </div>
            <h4 class="platform-name">{{ platform.name }}</h4>
            <p class="platform-desc">{{ getDesc(locale, idx % allPlatforms.length) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center mt-6 gap-6 text-xs text-[var(--c-fg-3)]">
      <span class="flex items-center gap-1">
        <i class="fas fa-mouse-pointer text-amber-400"></i>
        {{ locale === 'zh-CN' ? '悬停暂停' : 'Hover to pause' }}
      </span>
      <span class="hidden sm:flex items-center gap-1">
        <i class="fas fa-arrows-alt-h text-pink-400"></i>
        {{ locale === 'zh-CN' ? '自动滚动' : 'Auto scroll' }}
      </span>
    </div>
  </section>
</template>

<style scoped>
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-marquee {
  animation: marquee 50s linear infinite;
  width: max-content;
  will-change: transform;
  backface-visibility: hidden;
}

.animation-play-state-paused {
  animation-play-state: paused;
}

.platform-card {
  position: relative;
  width: 160px;
  padding: 1.5rem 1rem;
  background: var(--c-bg-card);
  border-radius: 1.25rem;
  border: 1px solid var(--c-border);
  text-decoration: none;
  text-align: center;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.platform-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(244, 114, 182, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.platform-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 20px 40px rgba(245, 158, 11, 0.15), 0 0 0 1px rgba(245, 158, 11, 0.1);
}

.platform-card:hover::before { opacity: 1; }

.platform-icon-container {
  position: relative;
  display: inline-block;
  margin-bottom: 0.75rem;
}

.platform-icon-wrapper {
  width: 56px;
  height: 56px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.875rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.platform-card:hover .platform-icon-wrapper {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.platform-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 0.25rem;
}

.platform-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  opacity: 0;
  filter: blur(20px);
  transition: all 0.35s ease;
  z-index: 0;
}

.platform-card:hover .platform-glow {
  opacity: 0.3;
  width: 80px;
  height: 80px;
}

.platform-name {
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--c-fg);
  margin-bottom: 0.25rem;
  transition: color 0.3s ease;
}

.platform-card:hover .platform-name { color: #f59e0b; }

.platform-desc {
  font-size: 0.75rem;
  color: var(--c-fg-3);
  line-height: 1.4;
  transition: color 0.3s ease;
}

.platform-hover-indicator {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
  color: #f59e0b;
}

.platform-card:hover .platform-hover-indicator {
  opacity: 1;
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .animate-marquee {
    animation: none;
    flex-wrap: wrap;
    justify-content: center;
  }
  .platform-card { transition: none; }
}

@media (max-width: 640px) {
  .platform-card { width: 140px; padding: 1.25rem 0.75rem; }
  .platform-icon-wrapper { width: 48px; height: 48px; }
  .platform-icon-img { width: 28px; height: 28px; }
}
</style>
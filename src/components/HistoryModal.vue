<script setup>
import { ref, computed } from 'vue'
import { useVideoStore } from '../stores/video'
import { getPlatformName } from '../services/historyService'

const props = defineProps({
  locale: {
    type: String,
    default: 'zh-CN'
  }
})

const emit = defineEmits(['restore', 'reparse', 'copy-url'])

const videoStore = useVideoStore()
const searchQuery = ref('')
const confirmClear = ref(false)

const filteredHistory = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return videoStore.historyList
  return videoStore.historyList.filter(item => {
    return (
      (item.title && item.title.toLowerCase().includes(query)) ||
      (item.authorName && item.authorName.toLowerCase().includes(query)) ||
      (item.originalUrl && item.originalUrl.toLowerCase().includes(query)) ||
      (getPlatformName(item.platform).toLowerCase().includes(query))
    )
  })
})

const handleRestore = (item) => {
  emit('restore', item)
  videoStore.closeHistory()
}

const handleReparse = (item) => {
  emit('reparse', item)
  videoStore.closeHistory()
}

const handleCopy = (item) => {
  emit('copy-url', item.originalUrl)
}

const handleDelete = (id) => {
  videoStore.removeHistoryRecord(id)
}

const handleClearAll = () => {
  if (!confirmClear.value) {
    confirmClear.value = true
    setTimeout(() => {
      confirmClear.value = false
    }, 4000)
    return
  }
  videoStore.clearAllHistory()
  confirmClear.value = false
}

const getTypeBadge = (item) => {
  if (item.type === 'image' || item.imagesCount > 0) {
    return { text: `图集 · ${item.imagesCount || item.resultData?.images?.length || 0}张`, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
  }
  if (item.type === 'live' || item.liveCount > 0) {
    return { text: `实况 · ${item.liveCount || 0}组`, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' }
  }
  return { text: '高清视频', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
}

const getPlatformBadgeColor = (platform) => {
  const map = {
    douyin: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    xhs: 'bg-red-500/10 text-red-500 border-red-500/20',
    kuaishou: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    bilibili: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
    weibo: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  }
  return map[platform] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="videoStore.showHistoryModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
        @click.self="videoStore.closeHistory()"
      >
        <div
          class="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--c-bg)] border border-[var(--c-border)] shadow-2xl overflow-hidden transition-all duration-300"
        >
          <!-- Modal Header -->
          <div class="px-5 py-4 border-b border-[var(--c-border)] flex items-center justify-between gap-3 bg-[var(--c-bg-elevated)]/60">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                <i class="fas fa-clock-rotate-left text-sm"></i>
              </div>
              <div>
                <h3 class="font-bold text-base sm:text-lg text-[var(--c-fg)] flex items-center gap-2">
                  解析记录
                  <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">
                    {{ videoStore.historyList.length }} 条
                  </span>
                </h3>
                <p class="text-xs text-[var(--c-fg-3)] hidden sm:block">
                  手机清理相册也不怕，随时重新找回并下载
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="videoStore.historyList.length > 0"
                @click="handleClearAll"
                class="px-2.5 py-1 text-xs rounded-lg transition-all border"
                :class="confirmClear ? 'bg-rose-500 text-white border-rose-500 font-bold' : 'text-[var(--c-fg-3)] hover:text-rose-500 border-transparent hover:bg-rose-500/10'"
                title="清空记录"
              >
                <i class="fas fa-trash-can mr-1"></i>
                {{ confirmClear ? '确定清空?' : '清空' }}
              </button>
              <button
                @click="videoStore.closeHistory()"
                class="p-2 rounded-lg text-[var(--c-fg-3)] hover:text-[var(--c-fg)] hover:bg-[var(--c-bg-elevated)] transition-colors"
                aria-label="关闭"
              >
                <i class="fas fa-times text-base"></i>
              </button>
            </div>
          </div>

          <!-- Search & Filter Bar -->
          <div v-if="videoStore.historyList.length > 0" class="px-5 py-3 border-b border-[var(--c-border)] bg-[var(--c-bg)]">
            <div class="relative">
              <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--c-fg-3)]"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索历史记录标题、作者或平台..."
                class="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-[var(--c-bg-elevated)] border border-[var(--c-border)] text-[var(--c-fg)] placeholder:text-[var(--c-fg-3)] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/10 transition-all"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--c-fg-3)] hover:text-[var(--c-fg)]"
              >
                <i class="fas fa-times-circle"></i>
              </button>
            </div>
          </div>

          <!-- History Items Scroll List -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            <!-- Empty State -->
            <div
              v-if="filteredHistory.length === 0"
              class="text-center py-12 px-4 flex flex-col items-center justify-center text-[var(--c-fg-3)]"
            >
              <div class="w-16 h-16 rounded-2xl bg-[var(--c-bg-elevated)] flex items-center justify-center mb-3 text-2xl text-[var(--c-fg-3)]">
                <i class="fas fa-box-open"></i>
              </div>
              <p class="text-sm font-medium text-[var(--c-fg-2)] mb-1">
                {{ searchQuery ? '未找到匹配的解析记录' : '暂无解析记录' }}
              </p>
              <p class="text-xs max-w-sm leading-relaxed">
                {{ searchQuery ? '尝试更换关键词搜索' : '每次成功解析的视频与图集都会自动妥善保存在这里，清理手机也不怕丢啦~' }}
              </p>
            </div>

            <!-- Record Card -->
            <div
              v-for="item in filteredHistory"
              :key="item.id"
              class="group relative flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3 sm:p-3.5 rounded-xl bg-[var(--c-bg-elevated)] border border-[var(--c-border)] hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-200"
            >
              <!-- Thumbnail Cover -->
              <div class="relative w-full sm:w-28 h-36 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black/20 flex items-center justify-center">
                <img
                  v-if="item.cover"
                  :src="item.cover"
                  :alt="item.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div v-else class="text-gray-400 text-xs flex flex-col items-center gap-1">
                  <i class="fas fa-image text-lg"></i>
                  <span>无封面</span>
                </div>

                <!-- Type Badge on Thumbnail -->
                <div class="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur-sm">
                    {{ item.type === 'image' ? `📷 ${item.imagesCount || 0}P` : item.type === 'live' ? '🔴 Live' : '🎬 视频' }}
                  </span>
                </div>
              </div>

              <!-- Main Content Info -->
              <div class="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                <div>
                  <!-- Badges & Time Row -->
                  <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span :class="['px-2 py-0.5 rounded text-[10px] font-medium border', getPlatformBadgeColor(item.platform)]">
                      {{ getPlatformName(item.platform) }}
                    </span>
                    <span :class="['px-2 py-0.5 rounded text-[10px] font-medium border', getTypeBadge(item).color]">
                      {{ getTypeBadge(item).text }}
                    </span>
                    <span class="text-[11px] text-[var(--c-fg-3)] ml-auto">
                      {{ item.timeStr }}
                    </span>
                  </div>

                  <!-- Title -->
                  <h4 class="text-sm font-semibold text-[var(--c-fg)] line-clamp-2 mb-1 leading-snug group-hover:text-amber-500 transition-colors">
                    {{ item.title || '无标题短视频 / 图集' }}
                  </h4>

                  <!-- Author & Url -->
                  <div class="flex items-center gap-2 text-xs text-[var(--c-fg-3)] truncate">
                    <span v-if="item.authorName" class="font-medium text-[var(--c-fg-2)] truncate max-w-[120px]">
                      @{{ item.authorName }}
                    </span>
                    <span v-if="item.authorName && item.originalUrl" class="opacity-40">•</span>
                    <span class="truncate opacity-75 font-mono text-[11px]">
                      {{ item.originalUrl }}
                    </span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2 mt-3 pt-2.5 border-t border-[var(--c-border)]/60 flex-wrap">
                  <!-- Restore & Download -->
                  <button
                    @click="handleRestore(item)"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-sm shadow-amber-500/20 hover:shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <i class="fas fa-cloud-arrow-down"></i>
                    <span>载入下载</span>
                  </button>

                  <!-- Re-parse (in case CDN links expired) -->
                  <button
                    @click="handleReparse(item)"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--c-bg)] text-[var(--c-fg-2)] hover:text-amber-500 border border-[var(--c-border)] hover:border-amber-400 active:scale-95 transition-all flex items-center gap-1"
                    title="重新解析（若下载链接过期时使用）"
                  >
                    <i class="fas fa-rotate text-[10px]"></i>
                    <span>重新解析</span>
                  </button>

                  <!-- Copy Original URL -->
                  <button
                    @click="handleCopy(item)"
                    class="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--c-bg)] text-[var(--c-fg-2)] hover:text-amber-500 border border-[var(--c-border)] hover:border-amber-400 active:scale-95 transition-all flex items-center gap-1"
                    title="复制作品分享链接"
                  >
                    <i class="fas fa-link text-[10px]"></i>
                    <span>复制链接</span>
                  </button>

                  <!-- Delete Item -->
                  <button
                    @click="handleDelete(item.id)"
                    class="ml-auto p-1.5 rounded-lg text-xs text-[var(--c-fg-3)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="删除此条记录"
                  >
                    <i class="fas fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Tips -->
          <div class="px-5 py-2.5 bg-[var(--c-bg-elevated)]/40 border-t border-[var(--c-border)] text-center text-[11px] text-[var(--c-fg-3)] flex items-center justify-center gap-2">
            <i class="fas fa-shield-halved text-amber-500"></i>
            <span>记录仅保存在本地设备，保护隐私，换机或卸载前建议手动备份重要链接</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { useVideoStore } from './stores/video'
import HeaderNav from './components/HeaderNav.vue'
import HeroSection from './components/HeroSection.vue'
import ResultSection from './components/ResultSection.vue'
import PlatformGrid from './components/PlatformGrid.vue'
import TutorialSection from './components/TutorialSection.vue'
import FaqSection from './components/FaqSection.vue'
import FooterSection from './components/FooterSection.vue'
import ToastContainer from './components/ToastContainer.vue'
import ProgressModal from './components/ProgressModal.vue'
import ParticlesCanvas from './components/ParticlesCanvas.vue'
import DownloadCard from './components/DownloadCard.vue'
import { useButtonControl } from './composables/useButtonControl'
import { useI18n } from './composables/useI18n'

const videoStore = useVideoStore()
const { t, locale } = useI18n()

/* ===== Capacitor 原生下载支持 =====
   网页版用 <a download> 触发浏览器下载；
   APK 内 WebView 不支持 <a download>（点了没反应/显示成功但无文件），
   必须通过原生 Filesystem 写入手机存储。 */
const isNative = () => typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
  reader.onerror = () => reject(new Error('Blob 转 Base64 失败'))
  reader.readAsDataURL(blob)
})

// 原生保存到 文档/sonnet/ 目录，返回显示路径（失败返回 null）
const saveBlobNative = async (blob, filename) => {
  try {
    const base64 = await blobToBase64(blob)
    const dir = Directory.Documents
    try { await Filesystem.mkdir({ path: 'sonnet', directory: dir, recursive: true }) } catch (e) { /* 已存在 */ }
    await Filesystem.writeFile({ path: `sonnet/${filename}`, data: base64, directory: dir, recursive: true })
    return `文档/sonnet/${filename}`
  } catch (e) {
    console.error('原生保存失败:', e)
    return null
  }
}

// 浏览器下载（网页版）
const triggerBrowserDownload = (blob, filename) => {
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl; a.download = filename || 'download'
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(blobUrl)
}

// 统一保存入口：原生写文件，网页走浏览器下载；返回保存路径（网页返回文件名）
const saveBlob = async (blob, filename) => {
  if (isNative()) {
    return await saveBlobNative(blob, filename)
  }
  triggerBrowserDownload(blob, filename)
  return filename
}

const isDark = ref(false)

const parseButton = useButtonControl({
  action: 'parse',
  throttleDelay: 1000,
  antiReplay: true,
  timeout: 60000,
  retry: false
})

const isDownloading = ref(false)
const showBackup = ref(false)
const inputUrl = ref('')
const parseError = ref('')
const currentPlatform = ref('all')
const currentVideoUrl = ref('')
const PARSE_TIMEOUT_MS = 55000

const MD5 = (str) => {
  const rotateLeft = (val, bits) => (val << bits) | (val >>> (32 - bits))
  const cvtHex = (val) => (val >>> 0).toString(16).padStart(8, '0')
  let x0 = 1732584193, x1 = -271733879, x2 = -1732584194, x3 = 271733878
  const table = []
  for (let i = 0; i < 64; i++) table[i] = (Math.abs(Math.sin(i + 1) * 4294967296)) | 0
  const utf8str = unescape(encodeURIComponent(str))
  const len = utf8str.length
  const words = []
  for (let i = 0; i < len; i++) words[i >> 2] |= (utf8str.charCodeAt(i) & 0xff) << ((i % 4) * 8)
  words[len >> 2] |= 0x80 << ((len % 4) * 8)
  words[(((len + 8) >> 6) << 4) + 15] = len * 8
  for (let i = 0; i < words.length; i += 16) {
    const [a, b, c, d] = [x0, x1, x2, x3]
    const M = [1, 5, 6, 25, 7, 22, 2, 13, 10, 9, 15, 21, 4, 11, 14, 20]
    const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22]
    const T = [0, 4, 8, 12, 16, 20, 24, 28, 0, 4, 8, 12, 16, 20, 24, 28, 0, 4, 8, 12, 16, 20, 24, 28]
    for (let j = 0; j < 64; j++) {
      const F = j < 16 ? (b & c) | ((~b) & d) : j < 32 ? (b & d) | (c & (~d)) : j < 48 ? (b ^ c ^ d) : (c ^ (b | (~d)))
      const g = j < 16 ? j : j < 32 ? (5 * j + 1) % 16 : j < 48 ? (3 * j + 5) % 16 : (7 * j) % 16
      const [A, B, C, D] = [x0, x1, x2, x3]
      x0 = x1 + rotateLeft((A + F + table[j] + (words[i + g] | 0)) | 0, S[j % 4 + Math.floor(j / 16) * 4])
      x1 = x2 + rotateLeft((B + F + table[j] + (words[i + M[j]] | 0)) | 0, T[j % 4 + Math.floor(j / 16) * 4])
      x2 = x3 + rotateLeft((C + F + table[j] + (words[i + g] | 0)) | 0, S[(j + 8) % 4 + Math.floor(j / 16) * 4])
      x3 = x0 + rotateLeft((D + F + table[j] + (words[i + M[(j + 5) % 16]] | 0)) | 0, T[(j + 4) % 4 + Math.floor(j / 16) * 4])
    }
    x0 = (x0 + a) | 0; x1 = (x1 + b) | 0; x2 = (x2 + c) | 0; x3 = (x3 + d) | 0
  }
  return cvtHex(x0) + cvtHex(x1) + cvtHex(x2) + cvtHex(x3)
}

const downloadCounter = new Map()

const getDownloadFilename = (url, ext) => {
  const base = MD5(url)
  const count = downloadCounter.get(base) || 0
  downloadCounter.set(base, count + 1)
  return `${base}_${count + 1}.${ext}`
}

// 从 URL 提取原始扩展名（保留原格式：webp/png/jpg/mp4...），无扩展名时用兜底
const getUrlExt = (url, fallback = 'jpg') => {
  try {
    const path = new URL(url).pathname
    const m = path.match(/\.([a-zA-Z0-9]{2,5})$/)
    if (m) return m[1].toLowerCase()
  } catch (e) { /* 非法 URL 走兜底 */ }
  return fallback
}

// 并发执行器：最多 limit 个任务同时跑，逐个启动直到全部完成
const runConcurrent = async (items, limit, worker) => {
  const results = []
  let index = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const i = index++
      results[i] = await worker(items[i], i)
    }
  })
  await Promise.all(runners)
  return results
}

const PLATFORM_API_MAP = {
  all: 'https://api.bugpk.com/api/short_videos',
  douyin: 'https://api.bugpk.com/api/douyin',
  kuaishou: 'https://api.bugpk.com/api/ksjx',
  bilibili: 'https://api.bugpk.com/api/bilibili',
  xhs: 'https://api.bugpk.com/api/xhsjx',
  toutiao: 'https://api.bugpk.com/api/toutiao',
}

const ESCAPE_REGEX = /[&<>"']/g
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
const blobUrlCache = new Map()

const cleanUrl = (url) => {
  if (!url) return ''
  return String(url).replace(ESCAPE_REGEX, m => ESCAPE_MAP[m])
}

const getBlobUrl = async (originalUrl) => {
  if (blobUrlCache.has(originalUrl)) return blobUrlCache.get(originalUrl)
  try {
    const response = await fetch(originalUrl, { method: 'GET', mode: 'cors', referrer: '' })
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    blobUrlCache.set(originalUrl, blobUrl)
    return blobUrl
  } catch (e) {
    return originalUrl
  }
}

const preloadMedia = async (resultData) => {
  if (resultData.images) {
    for (let i = 0; i < resultData.images.length; i++) {
      resultData.images[i] = await getBlobUrl(resultData.images[i])
    }
  }
  if (resultData.music?.url) resultData.music.url = await getBlobUrl(resultData.music.url)
  if (resultData.video_backup) {
    for (const backup of resultData.video_backup) {
      if (backup.url) backup.url = await getBlobUrl(backup.url)
    }
  }
}

const extractFirstHttpUrl = (text) => {
  if (!text) return null
  const match = text.match(/\bhttps?:\/\/[^\s<>"{}|\\^`\[\]]+/i)
  return match ? match[0].replace(/[),.;!?，。；！？]+$/, '') : null
}

const showToast = (message, type = 'success', duration = 3000) => {
  videoStore.addToast(message, type, duration)
}

class ParseError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ParseError'
    this.code = options.code
    this.status = options.status
    this.response = options.response
  }
}

const getApiMessage = (payload) => {
  if (!payload || typeof payload !== 'object') return ''
  const candidates = [
    payload.msg, payload.message, payload.error, payload.errmsg, payload.reason,
    payload.data?.msg, payload.data?.message, payload.data?.error
  ]
  return candidates.find(item => typeof item === 'string' && item.trim())?.trim() || ''
}

const inferMediaType = (data) => {
  if (Array.isArray(data.live_photo) && data.live_photo.length > 0) return 'live'
  if (Array.isArray(data.images) && data.images.length > 0 && !data.url) return 'image'
  return 'video'
}

const hasUsableResource = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  const hasMainUrl = typeof data.url === 'string' && data.url.trim().length > 0
  const hasImages = Array.isArray(data.images) && data.images.some(Boolean)
  const hasLivePhotos = Array.isArray(data.live_photo) && data.live_photo.some(item => item?.image || item?.video)
  const hasBackup = Array.isArray(data.video_backup) && data.video_backup.some(item => item?.url)
  const hasMusic = typeof data.music?.url === 'string' && data.music.url.trim().length > 0
  return hasMainUrl || hasImages || hasLivePhotos || hasBackup || hasMusic
}

const normalizeResultData = (rawData) => {
  const data = Array.isArray(rawData) ? rawData[0] : rawData
  if (!data || typeof data !== 'object') throw new ParseError('解析接口没有返回有效数据')
  if (!hasUsableResource(data)) throw new ParseError('解析完成，但没有找到可用的视频、图片或音乐资源')
  return {
    ...data,
    type: data.type || inferMediaType(data),
    title: data.title || data.desc || '',
    desc: data.desc || data.title || '',
    author: data.author || {},
    cover: data.cover || data.images?.[0] || '',
    url: data.url || null,
    quality: data.quality || '',
    duration: data.duration ?? null,
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    live_photo: Array.isArray(data.live_photo) ? data.live_photo : [],
    video_backup: Array.isArray(data.video_backup) ? data.video_backup.filter(item => item?.url) : [],
    music: data.music && typeof data.music === 'object' ? data.music : {},
    extra: data.extra && typeof data.extra === 'object' ? data.extra : {}
  }
}

const normalizeParserResponse = (payload) => {
  if (!payload || typeof payload !== 'object') throw new ParseError('接口返回为空，请稍后重试')
  const rawCode = payload.code ?? payload.status ?? payload.errCode
  const numericCode = Number(rawCode)
  const hasExplicitCode = rawCode !== undefined && rawCode !== null && rawCode !== ''
  const isSuccess = hasExplicitCode
    ? numericCode === 200 || rawCode === 'success' || rawCode === true
    : Boolean(payload.data || payload.url || payload.images || payload.live_photo)
  if (!isSuccess) {
    const message = getApiMessage(payload) || (numericCode === 404
      ? '作品不存在、已删除或暂时无法访问'
      : numericCode === 400 ? '链接格式不正确或缺少必要参数' : '解析失败，请稍后重试')
    throw new ParseError(message, { code: rawCode, response: payload })
  }
  return normalizeResultData(payload.data ?? payload.result ?? payload)
}

const fetchJsonWithTimeout = async (requestUrl, timeoutMs = PARSE_TIMEOUT_MS) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(requestUrl, {
      method: 'GET', signal: controller.signal, headers: { Accept: 'application/json' }
    })
    let data = null
    try { data = await response.json() } catch (e) {
      if (!response.ok) throw new ParseError(`接口请求失败（HTTP ${response.status}）`, { status: response.status })
      throw new ParseError('接口返回格式异常，请稍后再试')
    }
    if (!response.ok) throw new ParseError(getApiMessage(data) || `接口请求失败（HTTP ${response.status}）`, { status: response.status, response: data })
    return data
  } catch (e) {
    if (e.name === 'AbortError') throw new ParseError('请求超时，请稍后重试或切换平台接口', { code: 'timeout' })
    if (e instanceof ParseError) throw e
    if (e instanceof TypeError) throw new ParseError('网络连接失败，请检查网络后重试')
    throw e
  } finally { window.clearTimeout(timeoutId) }
}

const getFriendlyParseError = (error) => {
  if (!error) return '解析失败，请稍后重试'
  if (typeof error === 'string') return error
  return error.message || '解析失败，请稍后重试'
}

const copyUrl = async (url) => {
  if (!url) { showToast('复制失败', 'error'); return }
  try {
    await navigator.clipboard.writeText(cleanUrl(url))
    showToast('已复制到剪贴板')
  } catch (e) { showToast('复制失败', 'error') }
}

const parseVideo = async () => {
  parseError.value = ''
  const extractedUrl = extractFirstHttpUrl(inputUrl.value)
  if (extractedUrl) inputUrl.value = extractedUrl
  const url = extractedUrl || inputUrl.value
  if (!url || !url.startsWith('http')) {
    const message = '请输入有效的视频分享链接'
    parseError.value = message
    showToast(message, 'warning', 4000)
    return
  }
  const result = await parseButton.execute(async () => {
    videoStore.clearResult()
    currentVideoUrl.value = ''
    showBackup.value = false
    const apiUrl = PLATFORM_API_MAP[currentPlatform.value] || PLATFORM_API_MAP.all
    const data = await fetchJsonWithTimeout(`${apiUrl}?url=${encodeURIComponent(url)}`)
    const resultData = normalizeParserResponse(data)
    videoStore.setResult(resultData)
    await nextTick()
    try { videoStore.initSwiper() } catch (e) { console.warn('Swiper初始化失败:', e) }
    return resultData
  }, { disableRetry: true, disableTimeout: true })
  if (!result) {
    const errorMsg = getFriendlyParseError(parseButton.error.value)
    parseError.value = errorMsg
    showToast(errorMsg, 'error', 6000)
  } else {
    parseError.value = ''
    showToast('解析成功', 'success', 2200)
  }
}

const downloadFile = async (url, filename, downloadId, options = {}) => {
  if (!url) return 'failed'
  const abortController = new AbortController()
  if (downloadId) videoStore.updateDownload(downloadId, { abortController })
  try {
    videoStore.updateDownload(downloadId, { status: 'downloading', statusText: '下载中...', percent: 0, loaded: 0, total: 0 })
    const response = await fetch(url, { method: 'GET', mode: 'cors', signal: abortController.signal })
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength) : 0
    const reader = response.body.getReader()
    const chunks = []
    let loaded = 0
    let lastTime = Date.now()
    let lastLoaded = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      const now = Date.now()
      const timeDiff = (now - lastTime) / 1000
      if (timeDiff >= 0.3) {
        const speed = (loaded - lastLoaded) / timeDiff
        const percent = total > 0 ? Math.round((loaded / total) * 100) : 0
        videoStore.updateDownload(downloadId, { loaded, total, percent, speed })
        lastTime = now; lastLoaded = loaded
      }
    }
    const blob = new Blob(chunks)
    const savedPath = await saveBlob(blob, filename || 'download')
    if (isNative() && !savedPath) {
      throw new Error('原生存储写入失败')
    }
    videoStore.updateDownload(downloadId, { status: 'completed', statusText: '已完成', percent: 100, loaded: total, total })
    if (isNative() && savedPath && !options.silent) {
      showToast(`已保存到 ${savedPath}`, 'success', 6000)
    }
    return 'completed'
  } catch (e) {
    if (e.name === 'AbortError') {
      videoStore.updateDownload(downloadId, { status: 'cancelled', statusText: '已取消' })
      return 'cancelled'
    } else {
      console.error('Download error:', e)
      videoStore.updateDownload(downloadId, { status: 'failed', statusText: '下载失败', error: e.message })
      if (!isNative()) {
        const a = document.createElement('a')
        a.href = url; a.download = filename || 'download'; a.target = '_blank'; a.rel = 'noopener noreferrer'
        document.body.appendChild(a); a.click()
        document.body.removeChild(a)
      }
      return 'failed'
    }
  }
}

const downloadMainVideo = () => {
  if (videoStore.resultData?.url) {
    const url = currentVideoUrl.value || videoStore.resultData.url
    const filename = getDownloadFilename(url, 'mp4')
    const downloadId = videoStore.addDownload({ filename, url })
    downloadFile(url, filename, downloadId)
  }
}

const downloadBackupVideo = (backup) => {
  if (backup?.url) {
    const filename = getDownloadFilename(backup.url, 'mp4')
    const downloadId = videoStore.addDownload({ filename, url: backup.url })
    downloadFile(backup.url, filename, downloadId)
  }
}

// 并发逐个保存全部图片（原格式，不打包 zip）
const downloadAllImages = async () => {
  if (!videoStore.resultData?.images?.length) return
  const images = videoStore.resultData.images
  const results = await runConcurrent(images, 3, async (url) => {
    const filename = getDownloadFilename(url, getUrlExt(url, 'jpg'))
    const downloadId = videoStore.addDownload({ filename, url })
    return downloadFile(url, filename, downloadId, { silent: true })
  })
  const ok = results.filter(r => r === 'completed').length
  if (ok > 0) showToast(`已下载 ${ok}/${images.length} 张图片`, ok === images.length ? 'success' : 'warning', 5000)
  else showToast('图片下载失败，请重试', 'error')
}

// 下载全部：视频/图片/实况全部作为独立文件并发单链路下载（原格式，不打包 zip）
const downloadAll = async () => {
  const resultData = videoStore.resultData
  if (!resultData) return
  const tasks = []
  if (resultData.url) tasks.push({ url: resultData.url, ext: 'mp4' })
  for (const img of (resultData.images || [])) tasks.push({ url: img, ext: getUrlExt(img, 'jpg') })
  for (const item of (resultData.live_photo || [])) {
    if (item.image) tasks.push({ url: item.image, ext: getUrlExt(item.image, 'jpg') })
    if (item.video) tasks.push({ url: item.video, ext: 'mp4' })
  }
  if (!tasks.length) { showToast('没有可下载的资源', 'warning'); return }
  const results = await runConcurrent(tasks, 3, async (task) => {
    const filename = getDownloadFilename(task.url, task.ext)
    const downloadId = videoStore.addDownload({ filename, url: task.url })
    return downloadFile(task.url, filename, downloadId, { silent: true })
  })
  const ok = results.filter(r => r === 'completed').length
  if (ok > 0) showToast(`已下载 ${ok}/${tasks.length} 个文件`, ok === tasks.length ? 'success' : 'warning', 6000)
  else showToast('下载失败，请重试', 'error')
}

const downloadMusic = (music) => {
  if (music?.url) {
    const ext = music.url.includes('.mp3') ? 'mp3' : music.url.includes('.m4a') ? 'm4a' : 'mp3'
    const filename = getDownloadFilename(music.url, ext)
    const downloadId = videoStore.addDownload({ filename, url: music.url })
    downloadFile(music.url, filename, downloadId)
  }
}

const downloadLiveVideo = (item) => {
  if (item?.video) {
    const filename = getDownloadFilename(item.video, 'mp4')
    const downloadId = videoStore.addDownload({ filename, url: item.video })
    downloadFile(item.video, filename, downloadId)
  }
}

const downloadLiveCover = (item) => {
  if (item?.image) {
    const filename = getDownloadFilename(item.image, 'jpg')
    const downloadId = videoStore.addDownload({ filename, url: item.image })
    downloadFile(item.image, filename, downloadId)
  }
}

// 下载全部实况：每组实况的封面+视频各自作为独立文件并发下载（原格式，不打包 zip）
const downloadAllLivePhotos = async () => {
  const photos = videoStore.resultData?.live_photo
  if (!photos?.length) return
  const tasks = []
  for (const item of photos) {
    if (item.image) tasks.push({ url: item.image, ext: getUrlExt(item.image, 'jpg') })
    if (item.video) tasks.push({ url: item.video, ext: 'mp4' })
  }
  if (!tasks.length) { showToast('没有可下载的实况', 'warning'); return }
  const results = await runConcurrent(tasks, 3, async (task) => {
    const filename = getDownloadFilename(task.url, task.ext)
    const downloadId = videoStore.addDownload({ filename, url: task.url })
    return downloadFile(task.url, filename, downloadId, { silent: true })
  })
  const ok = results.filter(r => r === 'completed').length
  if (ok > 0) showToast(`已下载 ${ok}/${tasks.length} 个实况文件`, ok === tasks.length ? 'success' : 'warning', 5000)
  else showToast('实况下载失败，请重试', 'error')
}

// 下载全部封面：逐张并发保存（原格式，不打包 zip）
const downloadAllLiveCovers = async () => {
  const photos = videoStore.resultData?.live_photo
  if (!photos?.length) return
  const covers = photos.map(item => item.image).filter(Boolean)
  if (!covers.length) { showToast('没有可下载的封面', 'warning'); return }
  const results = await runConcurrent(covers, 3, async (url) => {
    const filename = getDownloadFilename(url, getUrlExt(url, 'jpg'))
    const downloadId = videoStore.addDownload({ filename, url })
    return downloadFile(url, filename, downloadId, { silent: true })
  })
  const ok = results.filter(r => r === 'completed').length
  if (ok > 0) showToast(`已下载 ${ok}/${covers.length} 张封面`, ok === covers.length ? 'success' : 'warning', 5000)
  else showToast('封面下载失败，请重试', 'error')
}

// 单张图片下载（图片集里挑一张好看的单独保存）
const downloadSingleImage = (url) => {
  if (!url) return
  const filename = getDownloadFilename(url, getUrlExt(url, 'jpg'))
  const downloadId = videoStore.addDownload({ filename, url })
  downloadFile(url, filename, downloadId)
}

const switchVideo = (backup) => {
  if (backup?.url) currentVideoUrl.value = backup.url
}

const handleCancelDownload = (id) => videoStore.cancelDownload(id)
const handleRetryDownload = (id) => {
  const download = videoStore.downloads.find(d => d.id === id)
  if (download) downloadFile(download.url, download.filename, id)
}
const handleClearCompleted = (id) => {
  if (id === 'all') videoStore.clearCompletedDownloads()
  else videoStore.removeDownload(id)
}

const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  const n = Number(num)
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '亿'
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '万'
  return String(n)
}

const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('sonnet-theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
}

const setLocale = (lang) => {
  locale.value = lang
  localStorage.setItem('sonnet-lang', lang)
  document.documentElement.lang = lang
}

const selectPlatform = (key) => {
  currentPlatform.value = key
  parseError.value = ''
}

watch(inputUrl, () => { if (parseError.value) parseError.value = '' })

onMounted(() => {
  const savedTheme = localStorage.getItem('sonnet-theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    const hour = new Date().getHours()
    isDark.value = hour < 6 || hour >= 18
  }
  document.documentElement.classList.toggle('dark', isDark.value)
  videoStore.initParticles()
})
</script>

<template>
  <div class="min-h-screen bg-[var(--c-bg)] text-[var(--c-fg)] transition-colors duration-500">
    <ParticlesCanvas />
    <ToastContainer />
    <ProgressModal />
    <DownloadCard
      :downloads="videoStore.downloads"
      @cancel="handleCancelDownload"
      @retry="handleRetryDownload"
      @clear-completed="handleClearCompleted"
    />

    <HeaderNav
      :is-dark="isDark"
      :locale="locale"
      @toggle-theme="toggleTheme"
      @set-locale="setLocale"
    />

    <main class="max-w-7xl mx-auto px-4 pb-8 pt-0 relative z-10">
      <HeroSection
        v-model:input-url="inputUrl"
        :is-loading="parseButton.isLoading.value"
        :is-error="!!parseError || parseButton.state.value === 'error'"
        :parse-error="parseError"
        :locale="locale"
        :current-platform="currentPlatform"
        @parse="parseVideo"
        @select-platform="selectPlatform"
      />

      <Transition name="result-fade" mode="out-in">
        <ResultSection
          v-if="videoStore.resultData"
          :key="videoStore.resultData?.url || 'result'"
          :result-data="videoStore.resultData"
          :is-downloading="isDownloading"
          :show-backup="showBackup"
          :locale="locale"
          :format-number="formatNumber"
          :format-duration="formatDuration"
          :current-video-url="currentVideoUrl"
          @download-main="downloadMainVideo"
          @download-backup="downloadBackupVideo"
          @download-all="downloadAll"
          @download-single-image="downloadSingleImage"
          @download-music="downloadMusic"
          @download-live-video="downloadLiveVideo"
          @download-live-cover="downloadLiveCover"
          @download-all-live="downloadAllLivePhotos"
          @download-all-live-covers="downloadAllLiveCovers"
          @copy-url="copyUrl"
          @toggle-backup="showBackup = !showBackup"
          @switch-video="switchVideo"
        />
      </Transition>

      <PlatformGrid :locale="locale" />
      <TutorialSection :locale="locale" />
      <FaqSection :locale="locale" />
    </main>

    <FooterSection :locale="locale" />
  </div>
</template>

<style scoped>
.result-fade-enter-active,
.result-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.result-fade-enter-from { opacity: 0; transform: translateY(10px); }
.result-fade-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
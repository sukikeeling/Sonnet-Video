/**
 * Sonnet Video 解析历史记录管理服务
 * 本地持久化 (localStorage)，即使手机清理下载目录或清理相册，历史记录永不丢失！
 */

const STORAGE_KEY = 'sonnet_parse_history'
const MAX_HISTORY_ITEMS = 150

export const detectPlatform = (url = '') => {
  const lower = url.toLowerCase()
  if (lower.includes('douyin.com') || lower.includes('iesdouyin.com')) return 'douyin'
  if (lower.includes('kuaishou.com') || lower.includes('kwai.com')) return 'kuaishou'
  if (lower.includes('bilibili.com') || lower.includes('b23.tv')) return 'bilibili'
  if (lower.includes('xiaohongshu.com') || lower.includes('xhslink.com')) return 'xhs'
  if (lower.includes('weibo.com') || lower.includes('weibo.cn')) return 'weibo'
  if (lower.includes('toutiao.com')) return 'toutiao'
  return 'all'
}

export const getPlatformName = (platformKey) => {
  const map = {
    douyin: '抖音',
    kuaishou: '快手',
    bilibili: 'B站',
    xhs: '小红书',
    weibo: '微博',
    toutiao: '今日头条',
    all: '通用平台'
  }
  return map[platformKey] || '未知平台'
}

export const formatHistoryTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  if (isToday) {
    return `今天 ${hours}:${minutes}`
  } else if (isYesterday) {
    return `昨天 ${hours}:${minutes}`
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  }
}

export const historyService = {
  getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.warn('读取历史记录失败:', e)
      return []
    }
  },

  saveHistory(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    } catch (e) {
      console.error('保存历史记录失败（可能超出配额）:', e)
      // 如果超额，尝试裁剪保留最近 50 条
      if (list.length > 50) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)))
        } catch (err2) {
          console.error('降级保存依然失败:', err2)
        }
      }
    }
  },

  addRecord(originalUrl, resultData, currentPlatform = 'all') {
    if (!resultData) return null
    const list = this.getHistory()
    const now = Date.now()

    const detected = detectPlatform(originalUrl)
    const platform = (currentPlatform && currentPlatform !== 'all') ? currentPlatform : detected

    const type = resultData.type || (resultData.images?.length ? 'image' : (resultData.live_photo?.length ? 'live' : 'video'))
    const title = resultData.title || resultData.desc || '无标题作品'
    const cover = resultData.cover || resultData.images?.[0] || resultData.live_photo?.[0]?.image || ''
    const authorName = resultData.author?.name || resultData.author?.nickname || ''
    const authorAvatar = resultData.author?.avatar || ''
    const imagesCount = Array.isArray(resultData.images) ? resultData.images.length : 0
    const liveCount = Array.isArray(resultData.live_photo) ? resultData.live_photo.length : 0

    // 去重：若相同链接已存在，先删除旧记录
    const cleanList = list.filter(item => {
      if (item.originalUrl && originalUrl && item.originalUrl.trim() === originalUrl.trim()) return false
      if (item.title && title && item.title === title && item.authorName === authorName) return false
      return true
    })

    const record = {
      id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now,
      timeStr: formatHistoryTime(now),
      originalUrl: originalUrl || '',
      title,
      cover,
      authorName,
      authorAvatar,
      platform,
      type,
      imagesCount,
      liveCount,
      hasVideo: !!resultData.url,
      hasMusic: !!resultData.music?.url,
      resultData // 完整保存原始解析对象，便于随时一键重新载入
    }

    cleanList.unshift(record)
    if (cleanList.length > MAX_HISTORY_ITEMS) {
      cleanList.length = MAX_HISTORY_ITEMS
    }

    this.saveHistory(cleanList)
    return record
  },

  deleteRecord(id) {
    const list = this.getHistory().filter(item => item.id !== id)
    this.saveHistory(list)
    return list
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

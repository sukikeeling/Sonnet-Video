/**
 * 多源解析服务：可视化选站 + 并发竞速 + 配额保护 + 莫宁高定支持
 *
 * 线路清单：
 *   - auto        智能极速竞速（全线路并发，谁快用谁）
 *   - layzz       凌云聚合源（支持30+平台，高速图集与视频）
 *   - zacao       杂草极速源（专精小红书图文与主流短视频）
 *   - bugpk       BugPK 经典源（老牌公共短视频接口）
 *   - xiaolvfang  效率坊备用源（独立备用，带配额保护）
 */

export const AVAILABLE_SOURCES = [
  { key: 'auto', name: '智能极速竞速', badge: '推荐 · 秒级响应', icon: 'fa-bolt', desc: '全线路并发竞速，自动选用最快结果' },
  { key: 'douyindirect', name: '抖音专线', badge: '自研直解 · 纯净无水印', icon: 'fa-play-circle', desc: '自研协议穿透与官方设备流，秒提原画视频与无水印图集' },
  { key: 'xhsdirect', name: '小红书专线', badge: '自研直解 · 突破登录', icon: 'fa-cube', desc: '自研密钥直解算法，突破小红书 .cn 登录墙与404' },
  { key: 'layzz', name: '凌云聚合源', badge: '全能 · 30+平台', icon: 'fa-cloud', desc: '支持抖音/小红书/快手/B站超清图文与视频' },
  { key: 'zacao', name: '杂草极速源', badge: '图文/直链专精', icon: 'fa-seedling', desc: '专精小红书图文与主流短视频直链' },
  { key: 'bugpk', name: 'BugPK 经典源', badge: '经典公共接口', icon: 'fa-cube', desc: '老牌短视频去水印公共接口' },
  { key: 'xiaolvfang', name: '效率坊备用', badge: '独立备用节点', icon: 'fa-shield-halved', desc: '独立图文与视频备用线路' }
]

const ZACAO_ENDPOINT = 'https://video.zacao.top/api/parse'
const ZACAO_TIMEOUT_MS = 15000

const LAYZZ_ENDPOINT = 'https://proxy.layzz.cn/lyz/getAnalyse'
const LAYZZ_TOKEN = 'uuic-qackd-fga-test'
const LAYZZ_TIMEOUT_MS = 15000

const XLF_ENDPOINT = 'https://www.xiaolvfang.com/api/url/parse'
const XLF_REFERER = 'https://www.xiaolvfang.com/'
const XLF_SITE = 'https://www.xiaolvfang.com'
const XLF_TIMEOUT_MS = 18000

/** 效率坊配额冷却：一旦遇到 407/403，本地静默跳过一段时间，避免打扰 */
const XLF_COOLDOWN_KEY = 'sonnet.xlf.cooldown'
const XLF_COOLDOWN_MS = 30 * 60 * 1000 // 30 分钟

const readCooldown = () => {
  try {
    const v = Number(localStorage.getItem(XLF_COOLDOWN_KEY) || 0)
    return Number.isFinite(v) ? v : 0
  } catch (e) { return 0 }
}
const markCooldown = () => {
  try { localStorage.setItem(XLF_COOLDOWN_KEY, String(Date.now())) } catch (e) { /* 忽略 */ }
}
export const isXlfCoolingDown = () => Date.now() - readCooldown() < XLF_COOLDOWN_MS

/** 剥掉 HTML 标签，保留可读文本 */
const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

const pickMessage = (res) => {
  if (!res || typeof res !== 'object') return ''
  return stripHtml(res.message || res.msg || res.error || '')
}

/** 拼接超时 + 外部取消信号 */
const withTimeout = (outerSignal, timeoutMs) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const onAbort = () => ctrl.abort()
  if (outerSignal) {
    if (outerSignal.aborted) ctrl.abort()
    else outerSignal.addEventListener('abort', onAbort, { once: true })
  }
  return {
    signal: ctrl.signal,
    dispose: () => {
      clearTimeout(timer)
      if (outerSignal) outerSignal.removeEventListener('abort', onAbort)
    }
  }
}

/* ============================ 线路一：凌云聚合源 (Layzz) ============================ */
export const parseByLayzz = async (shareUrl, outerSignal) => {
  const cleanUrl = typeof shareUrl === 'string' ? shareUrl.trim() : ''
  if (!cleanUrl) throw new Error('链接为空')

  const { signal, dispose } = withTimeout(outerSignal, LAYZZ_TIMEOUT_MS)
  try {
    const ep = `${LAYZZ_ENDPOINT}?token=${LAYZZ_TOKEN}&link=${encodeURIComponent(cleanUrl)}`
    const response = await fetch(ep, {
      method: 'GET',
      signal,
      headers: { 'Accept': 'application/json' }
    })
    if (!response.ok) throw new Error(`请求失败(HTTP ${response.status})`)

    let res = null
    try { res = await response.json() } catch (e) { throw new Error('返回格式异常') }

    if (res?.code !== '0001' && res?.code !== 200 && res?.code !== '200') {
      throw new Error(res?.message || '凌云源解析失败')
    }

    const data = res?.data || {}
    const rawPics = Array.isArray(data.pics) ? data.pics : []
    const pics = rawPics.map(p => typeof p === 'string' ? p.trim() : (p?.url || '')).filter(Boolean)
    const videoUrl = typeof data.playAddr === 'string' && data.playAddr.trim() ? data.playAddr.trim() : null
    const cover = typeof data.cover === 'string' && data.cover.trim() ? data.cover.trim() : (pics[0] || '')
    const title = data.desc || data.title || ''

    if (!videoUrl && pics.length === 0) {
      throw new Error('未返回可用媒体直链')
    }

    return {
      type: videoUrl ? 'video' : (pics.length > 0 ? 'image' : 'video'),
      title,
      desc: title,
      author: {
        name: data.author || '网络创作者',
        avatar: data.avatar || ''
      },
      cover,
      url: videoUrl,
      quality: '',
      duration: null,
      images: pics,
      live_photo: [],
      video_backup: [],
      music: data.music ? { url: data.music } : {},
      extra: { source: 'layzz', sourceName: '凌云聚合源' }
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('凌云聚合源响应超时')
    throw err
  } finally {
    dispose()
  }
}

/* ============================ 线路二：杂草极速源 (Zacao) ============================ */
const buildZacaoResult = (data) => {
  const rawImages = Array.isArray(data.image_list) ? data.image_list.filter(Boolean) : []
  // 必须严格映射出 string URL，防止对象注入导致 [object Object] 图片损坏
  const cleanImages = rawImages.map(item => {
    if (typeof item === 'string') return item.trim()
    if (typeof item === 'object' && item !== null) {
      return (item.url || item.image || item.pic || '').trim()
    }
    return ''
  }).filter(Boolean)

  const livePhotos = rawImages
    .filter(item => typeof item === 'object' && item !== null && item.live_photo_url)
    .map(item => ({
      image: (item.url || '').trim(),
      video: (item.live_photo_url || '').trim()
    }))

  const rawVideos = Array.isArray(data.video_list) ? data.video_list.filter(Boolean) : []
  const videos = rawVideos.map(v => typeof v === 'string' ? v.trim() : (v?.url || '')).filter(Boolean)

  const mainVideo = (typeof data.video_url === 'string' && data.video_url.trim())
    ? data.video_url.trim()
    : (videos[0] || null)

  if (!mainVideo && cleanImages.length === 0 && livePhotos.length === 0) {
    throw new Error('线路未返回可用媒体直链')
  }

  const title = data.title || data.desc || ''
  const author = data.author || {}
  const cover = (typeof data.cover_url === 'string' && data.cover_url.trim())
    ? data.cover_url.trim()
    : ((typeof data.cover === 'string' && data.cover.trim()) ? data.cover.trim() : (cleanImages[0] || ''))

  return {
    type: mainVideo ? 'video' : (livePhotos.length > 0 ? 'live' : (cleanImages.length > 0 ? 'image' : 'video')),
    title,
    desc: title,
    author: {
      name: author.nickname || author.name || '',
      avatar: author.avatar || ''
    },
    cover,
    url: mainVideo,
    quality: '',
    duration: null,
    images: cleanImages,
    live_photo: livePhotos,
    video_backup: videos.slice(1).map(u => ({ url: u })),
    music: data.audio_url ? { url: data.audio_url } : {},
    extra: { source: 'zacao', sourceName: '杂草极速源' }
  }
}

export const parseByZacao = async (shareUrl, outerSignal) => {
  const cleanUrl = typeof shareUrl === 'string' ? shareUrl.trim() : ''
  if (!cleanUrl) throw new Error('链接为空')

  const { signal, dispose } = withTimeout(outerSignal, ZACAO_TIMEOUT_MS)
  try {
    const response = await fetch(ZACAO_ENDPOINT, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ url: cleanUrl })
    })
    if (!response.ok) throw new Error(`请求失败(HTTP ${response.status})`)

    let res = null
    try { res = await response.json() } catch (e) { throw new Error('返回格式异常') }

    if (res?.succ !== true && Number(res?.code) !== 200) {
      throw new Error(pickMessage(res) || '解析失败')
    }
    return buildZacaoResult(res.data || {})
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('杂草极速源响应超时')
    throw err
  } finally {
    dispose()
  }
}

/* ============================ 线路三：BugPK 经典源 ============================ */
const BUGPK_TIMEOUT_MS = 15000
const BUGPK_PLATFORM_MAP = {
  all: 'https://api.bugpk.com/api/short_videos',
  douyin: 'https://api.bugpk.com/api/douyin',
  kuaishou: 'https://api.bugpk.com/api/ksjx',
  bilibili: 'https://api.bugpk.com/api/bilibili',
  xhs: 'https://api.bugpk.com/api/xhsjx',
  toutiao: 'https://api.bugpk.com/api/toutiao'
}

export const parseByBugPk = async (shareUrl, outerSignal, platform = 'all') => {
  const cleanUrl = typeof shareUrl === 'string' ? shareUrl.trim() : ''
  if (!cleanUrl) throw new Error('链接为空')

  const endpoint = BUGPK_PLATFORM_MAP[platform] || BUGPK_PLATFORM_MAP.all
  const { signal, dispose } = withTimeout(outerSignal, BUGPK_TIMEOUT_MS)
  try {
    const response = await fetch(`${endpoint}?url=${encodeURIComponent(cleanUrl)}`, {
      method: 'GET',
      signal,
      headers: { 'Accept': 'application/json' }
    })
    if (!response.ok) throw new Error(`主源响应异常(HTTP ${response.status})`)

    let res = null
    try { res = await response.json() } catch (e) { throw new Error('返回格式异常') }

    const code = Number(res?.code ?? res?.status)
    if (code !== 200 && res?.code !== '200' && res?.success !== true) {
      throw new Error(res?.msg || res?.message || 'BugPK解析失败')
    }

    const data = res?.data || res?.result || res
    const rawImages = Array.isArray(data.images) ? data.images : (Array.isArray(data.pics) ? data.pics : [])
    const cleanImages = rawImages.map(img => typeof img === 'string' ? img.trim() : (img?.url || '')).filter(Boolean)
    const videoUrl = typeof data.url === 'string' && data.url.trim() ? data.url.trim() : (typeof data.video_url === 'string' ? data.video_url.trim() : null)

    if (!videoUrl && cleanImages.length === 0) {
      throw new Error('未返回可用媒体内容')
    }

    const title = data.title || data.desc || ''
    const author = data.author || {}
    const cover = data.cover || data.cover_url || cleanImages[0] || ''

    return {
      type: videoUrl ? 'video' : (cleanImages.length > 0 ? 'image' : 'video'),
      title,
      desc: title,
      author: {
        name: typeof author === 'string' ? author : (author.nickname || author.name || ''),
        avatar: author.avatar || ''
      },
      cover,
      url: videoUrl,
      quality: data.quality || '',
      duration: data.duration ?? null,
      images: cleanImages,
      live_photo: Array.isArray(data.live_photo) ? data.live_photo : [],
      video_backup: Array.isArray(data.video_backup) ? data.video_backup : [],
      music: data.music && typeof data.music === 'object' ? data.music : {},
      extra: { source: 'bugpk', sourceName: 'BugPK 经典源' }
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('BugPK响应超时')
    throw err
  } finally {
    dispose()
  }
}

/* ============================ 线路四：效率坊备用 ============================ */
const describeXlfStatus = (status, message) => {
  if (status === 407) {
    const share = message.match(/https?:\/\/www\.xiaolvfang\.com\/share\/[A-Za-z0-9]+/)
    return share
      ? `今日免费次数已用完，可点此链接补充额度：${share[0]}`
      : '今日免费次数已用完，请稍后再试'
  }
  if (status === 429) return '请求过于频繁，请稍后重试'
  return message || `解析失败(status ${status ?? '未知'})`
}

const buildXlfResult = (data) => {
  const videoUrl = typeof data.video_url === 'string' && data.video_url.trim()
    ? data.video_url.trim()
    : (typeof data.url === 'string' && data.url.trim() ? data.url.trim() : null)
  const rawPics = Array.isArray(data.pics) ? data.pics.filter(Boolean) : []
  const pics = rawPics.map(p => typeof p === 'string' ? p.trim() : (p?.url || p?.image || '')).filter(Boolean)

  if (!videoUrl && pics.length === 0) throw new Error('未返回可用媒体直链')

  const title = data.title || data.description || data.desc || ''
  let authorName = ''
  let authorAvatar = ''
  if (data.author && typeof data.author === 'object') {
    authorName = data.author.name || data.author.nickname || ''
    authorAvatar = data.author.avatar || ''
  } else if (typeof data.author === 'string') {
    authorName = data.author
  } else if (data.nickname) {
    authorName = data.nickname
  }
  if (!authorAvatar && data.avatar) authorAvatar = data.avatar

  return {
    type: videoUrl ? 'video' : (pics.length > 0 ? 'image' : 'video'),
    title,
    desc: title,
    author: { name: authorName, avatar: authorAvatar },
    cover: data.cover || data.thumbnail || pics[0] || '',
    url: videoUrl,
    quality: '',
    duration: null,
    images: pics,
    live_photo: [],
    video_backup: [],
    music: {},
    extra: { source: 'xiaolvfang', sourceName: '效率坊备用' }
  }
}

export const parseByXiaoLvFang = async (shareUrl, outerSignal) => {
  const cleanUrl = typeof shareUrl === 'string' ? shareUrl.trim() : ''
  if (!cleanUrl) throw new Error('链接为空')

  const { signal, dispose } = withTimeout(outerSignal, XLF_TIMEOUT_MS)
  try {
    const response = await fetch(XLF_ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': XLF_SITE,
        'Referer': XLF_REFERER,
        'timestamg': String(Date.now())
      },
      body: JSON.stringify({ url: cleanUrl })
    })
    if (!response.ok) throw new Error(`请求失败(HTTP ${response.status})`)

    let res = null
    try { res = await response.json() } catch (e) { throw new Error('返回格式异常') }

    const statusCode = Number(res?.status)
    if (!(res?.success === true || statusCode === 200)) {
      if (statusCode === 407 || statusCode === 403) markCooldown()
      throw new Error(describeXlfStatus(statusCode, pickMessage(res)))
    }
    return buildXlfResult(res.data || {})
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('效率坊响应超时')
    throw err
  } finally {
    dispose()
  }
}

/* ============================ 线路六：小红书自研直解 (XhsDirect) ============================ */
const XHS_TIMEOUT_MS = 15000
const XHS_UA = 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

export const parseByXhsDirect = async (shareUrl, outerSignal) => {
  let cleanUrl = typeof shareUrl === 'string' ? shareUrl.trim() : ''
  if (!cleanUrl) throw new Error('链接为空')

  const matchUrl = cleanUrl.match(/\bhttps?:\/\/[^\s<>"{}|\\^`\[\]\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+/i)
  if (matchUrl) {
    cleanUrl = matchUrl[0].replace(/[),.;!?，。；！？]+$/, '')
  }

  const { signal, dispose } = withTimeout(outerSignal, XHS_TIMEOUT_MS)
  try {
    const firstRes = await fetch(cleanUrl, {
      method: 'GET',
      signal,
      headers: {
        'User-Agent': XHS_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      redirect: 'follow'
    })

    const finalUrl = firstRes.url || cleanUrl

    let targetUrl = finalUrl
    if (targetUrl.includes('redirectPath=')) {
      const match = targetUrl.match(/redirectPath=([^&]+)/)
      if (match) {
        try {
          targetUrl = decodeURIComponent(match[1])
        } catch (e) {
          targetUrl = match[1]
        }
      }
    }

    let decodedTarget = targetUrl
    try {
      decodedTarget = decodeURIComponent(targetUrl)
    } catch (e) {}

    const itemMatch = decodedTarget.match(/(?:discovery\/item|explore)\/([a-zA-Z0-9]+)/) || targetUrl.match(/(?:discovery\/item|explore)\/([a-zA-Z0-9]+)/)
    const itemId = itemMatch ? itemMatch[1] : null

    const tokenMatch = decodedTarget.match(/xsec_token=([^&]+)/) || targetUrl.match(/xsec_token=([^&]+)/)
    let xsecToken = tokenMatch ? tokenMatch[1] : ''
    try {
      xsecToken = decodeURIComponent(xsecToken)
    } catch (e) {}

    let html = ''
    if (itemId) {
      const realUrl = `https://www.xiaohongshu.com/discovery/item/${itemId}?app_platform=android&xsec_token=${encodeURIComponent(xsecToken)}&xsec_source=app_share`
      const realRes = await fetch(realUrl, {
        method: 'GET',
        signal,
        headers: {
          'User-Agent': XHS_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })
      if (!realRes.ok) throw new Error(`小红书页面请求失败(HTTP ${realRes.status})`)
      html = await realRes.text()
    } else {
      if (!firstRes.ok) throw new Error(`小红书请求失败(HTTP ${firstRes.status})`)
      html = await firstRes.text()
    }

    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.+?\})<\/script>/) || html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\})<\/script>/)
    if (!stateMatch) {
      throw new Error('未在小红书页面中找到状态数据(__INITIAL_STATE__)')
    }

    let data = null
    try {
      const sanitized = stateMatch[1].replace(/:undefined/g, ':null')
      data = JSON.parse(sanitized)
    } catch (e) {
      throw new Error('解析小红书状态数据失败')
    }

    const note = data?.noteData?.data?.noteData || data?.noteData || data?.note
    if (!note) {
      throw new Error('未获取到小红书笔记数据')
    }

    const title = note.title || note.desc || ''
    const desc = note.desc || note.title || ''
    const author = {
      name: note.user?.nickName || note.user?.name || '小红书创作者',
      avatar: note.user?.avatar || ''
    }

    const toHttps = (url) => (typeof url === 'string' ? url.trim().replace(/^http:\/\//i, 'https://') : '')

    const rawImages = Array.isArray(note.imageList)
      ? note.imageList.map(img => toHttps(typeof img === 'string' ? img : (img?.url || ''))).filter(Boolean)
      : []

    let mediaV2 = note.video?.mediaV2
    if (typeof mediaV2 === 'string') {
      try {
        mediaV2 = JSON.parse(mediaV2)
      } catch (e) {
        mediaV2 = null
      }
    }

    const stream = mediaV2?.stream || {}
    let mainVideo = stream.h264?.[0]?.master_url || stream.h265?.[0]?.master_url || null
    if (mainVideo) {
      mainVideo = toHttps(mainVideo)
    }

    const rawBackup = [
      ...(Array.isArray(stream.h264?.[0]?.backup_urls) ? stream.h264[0].backup_urls : []),
      ...(stream.h265?.[0]?.master_url && stream.h265[0].master_url !== mainVideo ? [stream.h265[0].master_url] : []),
      ...(Array.isArray(stream.h265?.[0]?.backup_urls) ? stream.h265[0].backup_urls : [])
    ]
    const seenBackup = new Set()
    const videoBackup = []
    for (const b of rawBackup) {
      let u = typeof b === 'string' ? b.trim() : (b?.url || '').trim()
      if (u) {
        u = toHttps(u)
        if (!seenBackup.has(u) && u !== mainVideo) {
          seenBackup.add(u)
          videoBackup.push({ url: u })
        }
      }
    }

    const images = (mainVideo ? [] : rawImages).map(toHttps)
    const cover = toHttps(note.cover?.url || rawImages[0] || '')

    if (!mainVideo && images.length === 0) {
      throw new Error('未返回可用媒体直链')
    }

    return {
      type: mainVideo ? 'video' : 'image',
      title,
      desc,
      author,
      cover,
      url: mainVideo,
      quality: 'HD',
      duration: null,
      images,
      live_photo: [],
      video_backup: videoBackup,
      music: {},
      extra: { source: 'xhsdirect', sourceName: '小红书专线' }
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('小红书专线响应超时')
    throw err
  } finally {
    dispose()
  }
}

/* ============================ 线路五：抖音专线 (自研协议穿透与设备流直解) ============================ */
const DOUYIN_TIMEOUT_MS = 15000
const DOUYIN_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

/** 获取头条/抖音官方设备注册 ttwid 凭据 */
async function fetchTtwid(outerSignal) {
  try {
    const { signal, dispose } = withTimeout(outerSignal, 5000)
    try {
      const res = await fetch('https://ttwid.bytedance.com/ttwid/union/register/', {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': DOUYIN_UA
        },
        body: JSON.stringify({
          region: 'cn',
          aid: 1768,
          needFid: 'false',
          service: 'www.ixigua.com',
          migrate_info: { ticket: '', source: 'node' },
          cbUrlProtocol: 'https',
          union: 'true'
        })
      })
      const setCookie = res.headers.get('set-cookie') || ''
      const match = setCookie.match(/ttwid=([^;]+)/)
      if (match) return match[1]
    } finally {
      dispose()
    }
  } catch (e) {
    // 忽略注册异常，后续请求若自带 cookie 依然可走
  }
  return null
}

export const parseByDouyinDirect = async (shareUrl, outerSignal) => {
  const cleanUrl = typeof shareUrl === 'string' ? shareUrl.trim() : ''
  if (!cleanUrl) throw new Error('链接为空')

  const { signal, dispose } = withTimeout(outerSignal, DOUYIN_TIMEOUT_MS)
  try {
    const toHttps = (u) => (typeof u === 'string' ? u.trim().replace(/^http:\/\//i, 'https://') : '')

    // 1. 从分享文案中提取目标 URL
    const urlMatch = cleanUrl.match(/https?:\/\/(?:v\.douyin\.com\/[a-zA-Z0-9_\/]+|(?:www\.|m\.)?(?:iesdouyin|douyin)\.com\/(?:share\/)?(?:video|slides|note)\/\d+|www\.douyin\.com\/\d+)/i)
      || cleanUrl.match(/https?:\/\/[^\s<>"']+/i)
    const targetUrl = urlMatch ? urlMatch[0] : cleanUrl

    // 2. 先尝试直接从 URL 匹配 aweme_id
    let awemeId = null
    const directIdMatch = targetUrl.match(/\/(?:video|slides|note)\/(\d+)/i) || targetUrl.match(/iesdouyin\.com\/(?:share\/)?video\/(\d+)/i)
    if (directIdMatch) {
      awemeId = directIdMatch[1]
    }

    // 3. 异步获取 ttwid 凭据
    const ttwidPromise = fetchTtwid(signal)
    let firstHtml = ''

    // 若无 awemeId，则跟随短链重定向
    if (!awemeId) {
      const firstRes = await fetch(targetUrl, {
        method: 'GET',
        signal,
        headers: {
          'User-Agent': DOUYIN_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow'
      })

      // 3.1 尝试从重定向后的 finalUrl 匹配
      const finalUrl = firstRes.url || targetUrl
      const finalIdMatch = finalUrl.match(/\/(?:video|slides|note)\/(\d+)/i) || finalUrl.match(/iesdouyin\.com\/(?:share\/)?video\/(\d+)/i)
      if (finalIdMatch) {
        awemeId = finalIdMatch[1]
      }

      // 3.2 尝试从 Location 响应头匹配
      if (!awemeId) {
        const loc = firstRes.headers?.get('location') || firstRes.headers?.get('Location')
        if (loc) {
          const locMatch = loc.match(/\/(?:video|slides|note)\/(\d+)/i) || loc.match(/iesdouyin\.com\/(?:share\/)?video\/(\d+)/i)
          if (locMatch) awemeId = locMatch[1]
        }
      }

      // 3.3 核心穿透兜底：从首包 HTML 文本提取（适配 Android Capacitor 中原生底层 url 未更新的情况）
      firstHtml = await firstRes.text()
      if (!awemeId && firstHtml) {
        const htmlMatch = firstHtml.match(/["']itemId["']:\s*["'](\d+)["']/i)
          || firstHtml.match(/["']lastPath["']:\s*["'](\d+)["']/i)
          || firstHtml.match(/\/(?:video|slides|note)\/(\d+)/i)
          || firstHtml.match(/\/share\/video\/(\d+)/i)
          || firstHtml.match(/aweme_id=(\d+)/i)
          || firstHtml.match(/mid=(\d+)/i)
        if (htmlMatch) {
          awemeId = htmlMatch[1]
        }
      }
    }

    if (!awemeId) {
      throw new Error('未能在抖音链接中识别出作品 ID')
    }

    const ttwid = await ttwidPromise
    const headers = {
      'User-Agent': DOUYIN_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
    if (ttwid) {
      headers['Cookie'] = `ttwid=${ttwid}`
    }

    // 4. 获取详细页面 HTML（如果首包已有有效 router 数据且包含 videoInfoRes 则复用，否则带凭据请求专用详情页）
    let html = ''
    let parsed = null

    const tryParseRouter = (text) => {
      if (!text) return null
      const rm = text.match(/window\._ROUTER_DATA\s*=\s*(\{.*?\});?\s*<\/script>/)
        || text.match(/<script\s+id="RENDER_DATA"\s+type="application\/json"[^>]*>(.*?)<\/script>/)
      if (!rm) return null
      try {
        let rawJson = rm[1]
        if (rawJson.startsWith('%7B') || rawJson.startsWith('%7b')) rawJson = decodeURIComponent(rawJson)
        return JSON.parse(rawJson)
      } catch (e) {
        return null
      }
    }

    if (firstHtml) {
      const p = tryParseRouter(firstHtml)
      const pk = Object.keys(p?.loaderData || {}).find(k => k.includes('page'))
      if (p?.loaderData?.[pk]?.videoInfoRes?.item_list?.[0]) {
        parsed = p
        html = firstHtml
      }
    }

    if (!parsed) {
      const pageUrl = `https://www.iesdouyin.com/share/video/${awemeId}/`
      const pageRes = await fetch(pageUrl, {
        method: 'GET',
        signal,
        headers
      })
      if (!pageRes.ok) throw new Error(`抖音页面请求失败(HTTP ${pageRes.status})`)
      html = await pageRes.text()
      parsed = tryParseRouter(html)
    }

    if (!parsed) {
      throw new Error('未在抖音页面中找到有效数据结构')
    }

    // 5. 定位 itemStruct / item_list
    let item = null
    const pageKey = Object.keys(parsed?.loaderData || {}).find(k => k.includes('page'))
    if (pageKey && parsed.loaderData[pageKey]?.videoInfoRes?.item_list?.[0]) {
      item = parsed.loaderData[pageKey].videoInfoRes.item_list[0]
    } else {
      const walk = (obj) => {
        if (!obj || typeof obj !== 'object') return null
        if (obj.desc && (obj.video || obj.images)) return obj
        for (const k of Object.keys(obj)) {
          const res = walk(obj[k])
          if (res) return res
        }
        return null
      }
      item = walk(parsed)
    }

    if (!item) {
      throw new Error('未获取到该抖音视频/图文详细信息')
    }

    const title = item.desc || item.share_info?.share_title || '抖音作品'
    const desc = item.desc || ''
    const author = {
      name: item.author?.nickname || item.author?.unique_id || '抖音创作者',
      avatar: toHttps(item.author?.avatar_thumb?.url_list?.[0] || item.author?.avatar_medium?.url_list?.[0] || '')
    }

    // 处理无水印视频地址：替换 playwm -> play
    let rawPlayUrl = item.video?.play_addr?.url_list?.[0] || item.video?.playAddr?.url_list?.[0] || null
    let mainVideo = rawPlayUrl ? toHttps(rawPlayUrl.replace(/\/playwm\//g, '/play/').replace(/playwm/g, 'play')) : null

    // 备用播放地址
    const videoBackup = []
    const rawPlayList = item.video?.play_addr?.url_list || []
    for (const u of rawPlayList) {
      const fixed = toHttps(u.replace(/\/playwm\//g, '/play/').replace(/playwm/g, 'play'))
      if (fixed && fixed !== mainVideo) {
        videoBackup.push({ url: fixed })
      }
    }

    // 处理图集原图
    const rawImages = Array.isArray(item.images)
      ? item.images.map(img => toHttps(img?.url_list?.[0] || (typeof img === 'string' ? img : ''))).filter(Boolean)
      : []

    const cover = toHttps(item.video?.cover?.url_list?.[0] || rawImages[0] || '')
    const musicUrl = toHttps(item.music?.play_url?.url_list?.[0] || '')
    const isVideo = !!mainVideo && rawImages.length === 0

    return {
      type: isVideo ? 'video' : 'image',
      title,
      desc,
      author,
      cover,
      url: mainVideo,
      quality: 'HD',
      duration: item.duration ? Math.round(item.duration / 1000) : null,
      images: isVideo ? [] : rawImages,
      live_photo: [],
      video_backup: videoBackup,
      music: musicUrl ? { title: item.music?.title || '', url: musicUrl } : {},
      extra: { source: 'douyindirect', sourceName: '抖音专线' }
    }
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('抖音专线响应超时')
    throw err
  } finally {
    dispose()
  }
}

/* ============================ 线路六：并发竞速调度 ============================ */
export const raceParse = async (shareUrl, signal, racers) => {
  const active = (racers || []).filter(r => !(typeof r.skip === 'function' && r.skip()))
  if (active.length === 0) throw new Error('当前没有可用的解析线路')

  const controllers = active.map(() => new AbortController())
  const onOuterAbort = () => controllers.forEach(c => c.abort())
  if (signal) {
    if (signal.aborted) onOuterAbort()
    else signal.addEventListener('abort', onOuterAbort, { once: true })
  }

  const attempts = active.map((racer, i) => {
    const inner = controllers[i].signal
    const relay = new AbortController()
    const relayAbort = () => relay.abort()
    if (inner.aborted) relay.abort()
    else inner.addEventListener('abort', relayAbort, { once: true })
    return { name: racer.name, promise: Promise.resolve().then(() => racer.run(shareUrl, relay.signal)) }
  })

  try {
    const winner = await Promise.any(attempts.map(a => a.promise))
    return winner
  } catch (agg) {
    const errs = (agg && agg.errors) || []
    const detail = errs
      .map((e, i) => `${attempts[i]?.name || '线路' + (i + 1)}: ${(e && e.message) || e}`)
      .filter(Boolean)
      .join('；')
    throw new Error(detail || '所有解析线路均失败')
  } finally {
    controllers.forEach(c => c.abort())
    if (signal) signal.removeEventListener('abort', onOuterAbort)
  }
}

export default {
  AVAILABLE_SOURCES,
  parseByLayzz,
  parseByZacao,
  parseByBugPk,
  parseByXiaoLvFang,
  parseByXhsDirect,
  parseByDouyinDirect,
  raceParse,
  isXlfCoolingDown
}

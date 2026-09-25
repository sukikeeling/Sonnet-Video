/**
 * 多源解析服务：并发竞速 + 配额保护
 *
 * 设计原则：
 *   1) 并发竞速 —— 多个线路同时发起，谁先成功用谁，其余立即取消（用户端最快）
 *   2) 配额保护 —— 对已知有免费额度的线路（效率坊）做本地冷却，避免把额度打爆
 *   3) 格式归一 —— 各线路返回结构不同，统一转成项目既有的 normalizeResultData 期望格式
 *
 * 线路清单（2026-09-24 实测）：
 *   - zacao     video.zacao.top/api/parse   POST {url}   小红书图文/B站实测可用
 *   - xiaolvfang www.xiaolvfang.com/api/url/parse  POST {url}  图文/视频通吃，但每日免费额度按 IP 计
 */

const ZACAO_ENDPOINT = 'https://video.zacao.top/api/parse'
const ZACAO_TIMEOUT_MS = 15000

const XLF_ENDPOINT = 'https://www.xiaolvfang.com/api/url/parse'
const XLF_REFERER = 'https://www.xiaolvfang.com/'
const XLF_SITE = 'https://www.xiaolvfang.com'
const XLF_TIMEOUT_MS = 18000

/** 效率坊配额冷却：一旦遇到 407，本地静默跳过一段时间，别再去撞额度 */
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
/** 效率坊当前是否处于冷却期 */
export const isXlfCoolingDown = () => Date.now() - readCooldown() < XLF_COOLDOWN_MS

/** 剥掉 HTML 标签，保留可读文本 */
const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/** 统一从各种可能的字段里取错误信息 */
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

/* ============================ 线路一：zacao ============================ */

/** zacao 返回 → 项目统一结构 */
const buildZacaoResult = (data) => {
  const images = Array.isArray(data.image_list) ? data.image_list.filter(Boolean) : []
  const videos = Array.isArray(data.video_list) ? data.video_list.filter(Boolean) : []
  const mainVideo = (typeof data.video_url === 'string' && data.video_url.trim())
    ? data.video_url.trim()
    : (videos[0] || null)

  if (!mainVideo && images.length === 0) {
    throw new Error('线路未返回可用媒体直链')
  }

  const title = data.title || data.desc || ''
  const author = data.author || {}

  return {
    type: mainVideo ? 'video' : (images.length > 0 ? 'image' : 'video'),
    title,
    desc: title,
    author: {
      name: author.nickname || author.name || '',
      avatar: author.avatar || ''
    },
    cover: data.cover_url || data.cover || images[0] || '',
    url: mainVideo,
    quality: '',
    duration: null,
    images,
    live_photo: [],
    video_backup: videos.slice(1).map(u => ({ url: u })),
    music: {},
    extra: { source: 'zacao' }
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
    if (err?.name === 'AbortError') throw new Error('解析超时')
    throw err
  } finally {
    dispose()
  }
}

/* ========================== 线路二：效率坊 ========================== */

/** 平台特有状态码 → 用户可读文案 */
const describeXlfStatus = (status, message) => {
  if (status === 407) {
    const share = message.match(/https?:\/\/www\.xiaolvfang\.com\/share\/[A-Za-z0-9]+/)
    return share
      ? `今日免费次数已用完，可点开此链接补充额度：${share[0]}`
      : '今日免费次数已用完，请稍后再试'
  }
  if (status === 429) return '请求过于频繁，请稍后重试'
  return message || `解析失败(status ${status ?? '未知'})`
}

/** 效率坊返回 → 项目统一结构 */
const buildXlfResult = (data) => {
  const videoUrl = typeof data.video_url === 'string' && data.video_url.trim()
    ? data.video_url.trim()
    : (typeof data.url === 'string' && data.url.trim() ? data.url.trim() : null)
  const pics = Array.isArray(data.pics) ? data.pics.filter(Boolean) : []

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
    extra: { source: 'xiaolvfang' }
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
        'timestamg': String(Date.now()) // 原站拼写如此，勿改
      },
      body: JSON.stringify({ url: cleanUrl })
    })
    if (!response.ok) throw new Error(`请求失败(HTTP ${response.status})`)

    let res = null
    try { res = await response.json() } catch (e) { throw new Error('返回格式异常') }

    const statusCode = Number(res?.status)
    if (!(res?.success === true || statusCode === 200)) {
      // 额度耗尽 → 进入本地冷却，后续竞速不再打扰它
      if (statusCode === 407) markCooldown()
      throw new Error(describeXlfStatus(statusCode, pickMessage(res)))
    }
    return buildXlfResult(res.data || {})
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('解析超时')
    throw err
  } finally {
    dispose()
  }
}

/* ========================== 并发竞速调度 ========================== */

/**
 * 并发竞速：所有线路同时发起，第一个成功的结果胜出，其余全部取消。
 * @param {string} shareUrl
 * @param {AbortSignal} [signal] 外部取消信号
 * @param {Array<{name: string, run: (u: string, s?: AbortSignal) => Promise<object>, skip?: () => boolean}>} racers
 */
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
    // Promise.any：第一个成功即返回；全部失败才抛 AggregateError
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

export default { parseByZacao, parseByXiaoLvFang, raceParse, isXlfCoolingDown }

/**
 * 国内备用解析平台：效率坊（https://www.xiaolvfang.com/）
 * 支持抖音、快手、小红书、B站等100+平台
 */

export const parseXiaoLvFang = async (shareUrl, signal) => {
  const endpoint = 'https://www.xiaolvfang.com/api/url/parse'
  const payload = {
    url: shareUrl
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'timestamg': String(Date.now()),
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`效率坊请求失败(HTTP ${response.status})`)
  }

  const res = await response.json()
  if (!res || (res.status !== 200 && !res.success)) {
    throw new Error(res?.message || '效率坊解析失败')
  }

  const data = res.data || {}
  const isVideo = data.isVideo === true || Boolean(data.video_url)
  const pics = Array.isArray(data.pics) ? data.pics.filter(Boolean) : []
  const videoUrl = typeof data.video_url === 'string' && data.video_url.trim().length > 0 ? data.video_url.trim() : null

  if (!videoUrl && pics.length === 0) {
    throw new Error('效率坊未返回可用媒体直链')
  }

  const mediaType = isVideo && videoUrl ? 'video' : (pics.length > 0 ? 'image' : 'video')
  const title = data.title || data.desc || ''
  const cover = data.cover || pics[0] || ''

  return {
    type: mediaType,
    title: title,
    desc: title,
    author: {
      name: data.author || data.nickname || '',
      avatar: data.avatar || ''
    },
    cover: cover,
    url: videoUrl,
    quality: '',
    duration: null,
    images: pics,
    live_photo: [],
    video_backup: [],
    music: {},
    extra: {
      source: 'xiaolvfang'
    }
  }
}

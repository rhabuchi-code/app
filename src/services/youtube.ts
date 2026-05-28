import type { CalendarEvent } from '../types/calendar'

/**
 * YouTube Data API v3 - liveBroadcasts.list レスポンス
 * https://developers.google.com/youtube/v3/live/docs/liveBroadcasts/list
 */
export type YouTubeLiveBroadcast = {
  id: string
  snippet?: {
    title?: string
    description?: string
    scheduledStartTime?: string
    scheduledEndTime?: string
    channelId?: string
  }
}

export type YouTubeLiveBroadcastListResponse = {
  items?: YouTubeLiveBroadcast[]
  nextPageToken?: string
  pageInfo?: { totalResults?: number; resultsPerPage?: number }
}

/** broadcastStatus の取り得る値（API 準拠） */
export type BroadcastStatus =
  | 'all'
  | 'active'
  | 'completed'
  | 'upcoming'

const YOUTUBE_BASE = 'https://www.googleapis.com/youtube/v3'
const LIVE_BROADCASTS_URL = `${YOUTUBE_BASE}/liveBroadcasts`

export class YouTubeApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'YouTubeApiError'
    this.status = status
  }
}

async function youtubeGet<T>(
  path: string,
  params: Record<string, string>,
  init?: RequestInit,
): Promise<T> {
  const url = `${YOUTUBE_BASE}/${path}?${new URLSearchParams(params).toString()}`
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new YouTubeApiError(
      `YouTube API request failed: ${res.status} ${res.statusText}${
        text ? ` - ${text.slice(0, 200)}` : ''
      }`,
      res.status,
    )
  }
  return (await res.json()) as T
}

/** 追跡したいチャンネルの最小情報 */
export type YouTubeChannelInfo = {
  id: string
  title: string
  handle?: string
  thumbnailUrl?: string
}

type ApiChannelItem = {
  id: string
  snippet?: {
    title?: string
    customUrl?: string
    thumbnails?: {
      default?: { url?: string }
      medium?: { url?: string }
    }
  }
}

function pickChannelInfo(item: ApiChannelItem | undefined): YouTubeChannelInfo | null {
  if (!item?.id) return null
  return {
    id: item.id,
    title: item.snippet?.title ?? '(無題のチャンネル)',
    handle: item.snippet?.customUrl,
    thumbnailUrl:
      item.snippet?.thumbnails?.medium?.url ??
      item.snippet?.thumbnails?.default?.url,
  }
}

/** @ハンドル からチャンネル情報を解決する */
export async function resolveChannelByHandle(
  apiKey: string,
  handle: string,
  signal?: AbortSignal,
): Promise<YouTubeChannelInfo | null> {
  const normalized = handle.startsWith('@') ? handle : `@${handle}`
  const data = await youtubeGet<{ items?: ApiChannelItem[] }>(
    'channels',
    { part: 'snippet', forHandle: normalized, key: apiKey },
    { signal },
  )
  return pickChannelInfo(data.items?.[0])
}

/** UCxxx 形式のチャンネルIDから情報を解決する */
export async function resolveChannelById(
  apiKey: string,
  channelId: string,
  signal?: AbortSignal,
): Promise<YouTubeChannelInfo | null> {
  const data = await youtubeGet<{ items?: ApiChannelItem[] }>(
    'channels',
    { part: 'snippet', id: channelId, key: apiKey },
    { signal },
  )
  return pickChannelInfo(data.items?.[0])
}

type ApiSearchItem = { id?: { videoId?: string } }
type ApiVideoItem = {
  id: string
  snippet?: { title?: string; description?: string }
  liveStreamingDetails?: {
    scheduledStartTime?: string
    scheduledEndTime?: string
  }
}

/**
 * 公開された予定配信を API Key 経由で取得する。
 *
 * 流れ:
 *   1) `search.list?eventType=upcoming&type=video&channelId=...` で動画ID リスト
 *      （100 ユニット / 呼び出し）
 *   2) `videos.list?part=snippet,liveStreamingDetails&id=...` で開始時刻まで取得
 *      （1 ユニット / 呼び出し）
 *
 * 非公開・限定公開の配信は API Key では取得できない（OAuth 経路で補完）。
 */
export async function fetchPublicUpcomingByChannel(
  apiKey: string,
  channelId: string,
  options: {
    now?: Date
    maxResults?: number
    signal?: AbortSignal
  } = {},
): Promise<CalendarEvent[]> {
  const search = await youtubeGet<{ items?: ApiSearchItem[] }>(
    'search',
    {
      part: 'id',
      channelId,
      eventType: 'upcoming',
      type: 'video',
      maxResults: String(options.maxResults ?? 25),
      key: apiKey,
    },
    { signal: options.signal },
  )

  const videoIds = (search.items ?? [])
    .map((it) => it.id?.videoId)
    .filter((v): v is string => !!v)
  if (videoIds.length === 0) return []

  const videos = await youtubeGet<{ items?: ApiVideoItem[] }>(
    'videos',
    {
      part: 'snippet,liveStreamingDetails',
      id: videoIds.join(','),
      key: apiKey,
    },
    { signal: options.signal },
  )

  // videos.list の結果を YouTubeLiveBroadcast 形式に詰め直して、
  // 既存の toCalendarEvents で変換する（フィルタ・終了時刻補完を共有するため）。
  const broadcasts: YouTubeLiveBroadcast[] = (videos.items ?? []).map((v) => ({
    id: v.id,
    snippet: {
      title: v.snippet?.title,
      description: v.snippet?.description,
      scheduledStartTime: v.liveStreamingDetails?.scheduledStartTime,
      scheduledEndTime: v.liveStreamingDetails?.scheduledEndTime,
      channelId,
    },
  }))
  return toCalendarEvents(broadcasts, { now: options.now })
}

/**
 * 認可済みアクセストークンで自分の配信予定を取得する。
 * 401 は呼び出し側で「再認証」へ誘導する想定。
 *
 * 注意: `liveBroadcasts.list` の filter パラメータ（id / mine / broadcastStatus）は
 * 厳密に 1 つだけしか指定できない仕様。 OAuth でトークンを渡している場合、
 * `broadcastStatus` を使えば自動的に認証ユーザーの配信に絞り込まれるため、
 * `mine=true` は併用しない。
 * https://developers.google.com/youtube/v3/live/docs/liveBroadcasts/list#parameters
 */
export async function fetchUpcomingBroadcasts(
  accessToken: string,
  options: {
    broadcastStatus?: BroadcastStatus
    maxResults?: number
    signal?: AbortSignal
  } = {},
): Promise<YouTubeLiveBroadcast[]> {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,status',
    broadcastStatus: options.broadcastStatus ?? 'upcoming',
    maxResults: String(options.maxResults ?? 50),
  })

  const res = await fetch(`${LIVE_BROADCASTS_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: options.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new YouTubeApiError(
      `YouTube API request failed: ${res.status} ${res.statusText}${
        text ? ` - ${text.slice(0, 200)}` : ''
      }`,
      res.status,
    )
  }

  const data = (await res.json()) as YouTubeLiveBroadcastListResponse
  return data.items ?? []
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** ISO8601 文字列を ローカルタイムゾーンの YYYY-MM-DD / HH:mm に分解 */
export function splitLocalDateTime(iso: string): {
  date: string
  time: string
} {
  const d = new Date(iso)
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

/**
 * YouTube broadcast を CalendarEvent に変換する。
 * - scheduledStartTime が無い／パース不能な項目は除外
 * - 現在時刻より過去の項目は除外（YouTube が自動生成する "default broadcast"
 *   や、取り残された古い予定を取り除くため。 default broadcast は
 *   scheduledStartTime が 1970-01-01 になっていることが多く、この条件で確実に
 *   弾ける）
 * - 終了時刻が無い／同日の終了時刻が無い場合は endTime を **未設定** にする
 *   （視聴者にとって「未確定の終了時刻」を勝手に補完しないため）
 * - 日跨ぎの場合は開始日の枠に表示し、メモに終了日時を残す
 * - source: 'youtube'、color: 'red' 固定（編集はユーザーオーバーライド経由）
 */
export function toCalendarEvents(
  broadcasts: YouTubeLiveBroadcast[],
  options: { now?: Date } = {},
): CalendarEvent[] {
  const nowMs = (options.now ?? new Date()).getTime()
  const events: CalendarEvent[] = []
  for (const b of broadcasts) {
    const startIso = b.snippet?.scheduledStartTime
    if (!startIso) continue

    const startMs = Date.parse(startIso)
    if (Number.isNaN(startMs)) continue
    if (startMs < nowMs) continue

    const start = splitLocalDateTime(startIso)
    const endIso = b.snippet?.scheduledEndTime
    let endTime: string | undefined
    let crossesDay = false
    if (endIso) {
      const end = splitLocalDateTime(endIso)
      if (end.date === start.date) {
        endTime = end.time
      } else {
        crossesDay = true
        // 日跨ぎは endTime を勝手に丸めず未設定にし、メモへ実時刻を残す
      }
    }

    const title = b.snippet?.title?.trim() || '(無題の配信)'
    const url = `https://www.youtube.com/watch?v=${b.id}`
    const notesLines: string[] = []
    if (b.snippet?.description?.trim()) {
      notesLines.push(b.snippet.description.trim())
    }
    if (crossesDay && endIso) {
      notesLines.push(`終了予定: ${endIso}`)
    }

    events.push({
      id: `yt:${b.id}`,
      title,
      date: start.date,
      startTime: start.time,
      endTime,
      color: 'red',
      location: 'YouTube Live',
      notes: notesLines.join('\n\n') || undefined,
      source: 'youtube',
      externalId: b.id,
      url,
    })
  }
  return events
}

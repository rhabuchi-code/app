import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  requestAccessToken,
  revokeAccessToken,
  type AcquiredToken,
} from '../services/googleAuth'
import {
  fetchPublicUpcomingByChannel,
  fetchUpcomingBroadcasts,
  resolveChannelByHandle,
  resolveChannelById,
  toCalendarEvents,
  YouTubeApiError,
} from '../services/youtube'
import type { CalendarEvent } from '../types/calendar'
import { parseChannelInput } from '../utils/youtubeChannelInput'
import { applyOverrides } from '../utils/youtubeOverrides'
import { useYouTubeOverrides } from '../hooks/useYouTubeOverrides'
import {
  YouTubeContext,
  type ChannelSyncStatus,
  type OAuthStatus,
  type TrackedChannel,
} from './youtubeContext'

const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'
const TOKEN_STORAGE_KEY = 'calendar-youtube-token'
const CHANNELS_STORAGE_KEY = 'calendar-youtube-channels'
/** 自動同期の間隔（クォータ消費を考慮して 30 分） */
const AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000
/**
 * トークンの「先取り更新」しきい値。
 * アクセストークンは Google 標準で 1 時間。残りがこの時間を切ったら
 * サイレントで再取得して、同期処理が 401 で空振りするのを避ける。
 */
const TOKEN_REFRESH_AHEAD_MS = 10 * 60 * 1000

type StoredToken = {
  accessToken: string
  expiresAt: number
  scope: string
}

function readStoredToken(): StoredToken | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredToken
    if (
      typeof parsed.accessToken === 'string' &&
      typeof parsed.expiresAt === 'number' &&
      parsed.expiresAt > Date.now()
    ) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

function writeStoredToken(token: AcquiredToken) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
  } catch {
    /* ignore */
  }
}

function clearStoredToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

function loadChannels(): TrackedChannel[] {
  try {
    const raw = localStorage.getItem(CHANNELS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TrackedChannel[]
    if (Array.isArray(parsed)) {
      return parsed
        .filter((c): c is TrackedChannel => typeof c?.id === 'string')
        .map((c) => ({
          id: c.id,
          title: c.title ?? '(無題のチャンネル)',
          handle: c.handle,
          thumbnailUrl: c.thumbnailUrl,
          addedAt: typeof c.addedAt === 'number' ? c.addedAt : Date.now(),
        }))
    }
  } catch {
    /* ignore */
  }
  return []
}

function saveChannels(channels: TrackedChannel[]) {
  try {
    localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(channels))
  } catch {
    /* ignore */
  }
}

function mergeEvents(...sources: CalendarEvent[][]): CalendarEvent[] {
  const map = new Map<string, CalendarEvent>()
  for (const list of sources) {
    for (const e of list) {
      // 同一の YouTube 動画は API Key/OAuth どちらでも `yt:<videoId>` で同じ id になり、
      // 後勝ちで自然に重複排除される（OAuth 由来を後段で渡せば優先される）。
      map.set(e.id, e)
    }
  }
  return Array.from(map.values())
}

export function YouTubeProvider({ children }: { children: ReactNode }) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const isApiKeyConfigured = Boolean(apiKey)
  const isOAuthConfigured = Boolean(clientId)

  // ---- API Key 経路 ----
  const [channels, setChannels] = useState<TrackedChannel[]>(loadChannels)
  const [channelEvents, setChannelEvents] = useState<CalendarEvent[]>([])
  const [channelStatus, setChannelStatus] = useState<ChannelSyncStatus>('idle')
  const [channelError, setChannelError] = useState<string | null>(null)
  const [channelLastSyncedAt, setChannelLastSyncedAt] = useState<number | null>(
    null,
  )

  useEffect(() => {
    saveChannels(channels)
  }, [channels])

  const syncChannelsImpl = useCallback(
    async (list: TrackedChannel[]) => {
      if (!apiKey || list.length === 0) {
        setChannelEvents([])
        setChannelStatus('idle')
        return
      }
      setChannelStatus('syncing')
      setChannelError(null)
      try {
        const results = await Promise.all(
          list.map((c) => fetchPublicUpcomingByChannel(apiKey, c.id)),
        )
        setChannelEvents(results.flat())
        setChannelLastSyncedAt(Date.now())
        setChannelStatus('idle')
      } catch (e) {
        setChannelStatus('error')
        setChannelError(
          e instanceof Error ? e.message : 'チャンネルの同期に失敗しました',
        )
      }
    },
    [apiKey],
  )

  const syncChannels = useCallback(async () => {
    await syncChannelsImpl(channels)
  }, [channels, syncChannelsImpl])

  const addChannel = useCallback(
    async (input: string): Promise<TrackedChannel | null> => {
      if (!apiKey) {
        setChannelError('API Key が未設定です')
        return null
      }
      const target = parseChannelInput(input)
      if (target.kind === 'unknown') {
        setChannelError(
          'チャンネルURL、@ハンドル、または UCxxxx 形式のIDを入力してください',
        )
        return null
      }
      setChannelError(null)
      setChannelStatus('syncing')
      try {
        const info =
          target.kind === 'handle'
            ? await resolveChannelByHandle(apiKey, target.handle)
            : await resolveChannelById(apiKey, target.id)
        if (!info) {
          setChannelStatus('idle')
          setChannelError('チャンネルが見つかりませんでした')
          return null
        }
        if (channels.some((c) => c.id === info.id)) {
          setChannelStatus('idle')
          setChannelError('そのチャンネルは既に追加されています')
          return null
        }
        const next: TrackedChannel = {
          id: info.id,
          title: info.title,
          handle: info.handle,
          thumbnailUrl: info.thumbnailUrl,
          addedAt: Date.now(),
        }
        const newList = [...channels, next]
        setChannels(newList)
        await syncChannelsImpl(newList)
        return next
      } catch (e) {
        setChannelStatus('error')
        setChannelError(
          e instanceof Error ? e.message : 'チャンネル追加に失敗しました',
        )
        return null
      }
    },
    [apiKey, channels, syncChannelsImpl],
  )

  const removeChannel = useCallback(
    (id: string) => {
      const newList = channels.filter((c) => c.id !== id)
      setChannels(newList)
      setChannelEvents((prev) =>
        prev.filter((e) => {
          // チャンネル削除に伴うイベント除去は最善努力（次回同期で完全に整合）。
          return !!e.externalId
        }),
      )
      void syncChannelsImpl(newList)
    },
    [channels, syncChannelsImpl],
  )

  // 起動時にチャンネルがあれば自動同期
  useEffect(() => {
    if (!isApiKeyConfigured || channels.length === 0) return
    const id = setTimeout(() => {
      void syncChannelsImpl(channels)
    }, 0)
    return () => clearTimeout(id)
    // 初回マウントのみ実行する（チャンネル変更時は add/remove 側で同期する）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApiKeyConfigured])

  // 一定間隔の自動同期（API Key 経路）
  // 最新の channels / 最終同期時刻を参照しつつ、setInterval の再生成を避けるため
  // ref 経由で読み取る（ref 書き込みはエフェクト内で行う）。
  const channelsRef = useRef(channels)
  const channelLastSyncedAtRef = useRef(channelLastSyncedAt)
  useEffect(() => {
    channelsRef.current = channels
  }, [channels])
  useEffect(() => {
    channelLastSyncedAtRef.current = channelLastSyncedAt
  }, [channelLastSyncedAt])
  useEffect(() => {
    if (!isApiKeyConfigured) return
    const tick = () => {
      const list = channelsRef.current
      if (list.length === 0) return
      void syncChannelsImpl(list)
    }
    const intervalId = window.setInterval(tick, AUTO_SYNC_INTERVAL_MS)
    const onFocus = () => {
      const last = channelLastSyncedAtRef.current
      if (last && Date.now() - last < AUTO_SYNC_INTERVAL_MS) return
      tick()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [isApiKeyConfigured, syncChannelsImpl])

  // ---- OAuth 経路 ----
  const tokenRef = useRef<AcquiredToken | null>(null)
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus>(
    isOAuthConfigured ? 'disconnected' : 'unavailable',
  )
  const [oauthEvents, setOauthEvents] = useState<CalendarEvent[]>([])
  const [oauthLastSyncedAt, setOauthLastSyncedAt] = useState<number | null>(
    null,
  )
  const [oauthError, setOauthError] = useState<string | null>(null)

  /**
   * Google の SSO セッションが残っていれば、ユーザー操作ゼロで新しい
   * アクセストークンを取り直す（GIS の `prompt: ''`）。
   * - 成功時: tokenRef / sessionStorage を更新して返す
   * - 失敗時: null を返す（呼び出し側で consent フォールバックする想定）
   */
  const acquireTokenSilently =
    useCallback(async (): Promise<AcquiredToken | null> => {
      if (!clientId) return null
      try {
        const token = await requestAccessToken({
          clientId,
          scope: YOUTUBE_SCOPE,
          prompt: '',
        })
        tokenRef.current = token
        writeStoredToken(token)
        return token
      } catch {
        return null
      }
    }, [clientId])

  const oauthSyncImpl = useCallback(
    async (token: AcquiredToken) => {
      setOauthStatus('syncing')
      setOauthError(null)
      try {
        const broadcasts = await fetchUpcomingBroadcasts(token.accessToken)
        setOauthEvents(toCalendarEvents(broadcasts))
        setOauthLastSyncedAt(Date.now())
        setOauthStatus('connected')
      } catch (e) {
        if (e instanceof YouTubeApiError && e.status === 401) {
          // サーバ側で先に失効していたケース。サイレントで取り直して 1 回だけリトライ。
          const refreshed = await acquireTokenSilently()
          if (refreshed) {
            try {
              const broadcasts = await fetchUpcomingBroadcasts(
                refreshed.accessToken,
              )
              setOauthEvents(toCalendarEvents(broadcasts))
              setOauthLastSyncedAt(Date.now())
              setOauthStatus('connected')
              return
            } catch {
              /* fallthrough → 明示的な再連携を促す */
            }
          }
          tokenRef.current = null
          clearStoredToken()
          setOauthStatus('disconnected')
          setOauthError('セッションが切れました。もう一度連携してください。')
          return
        }
        setOauthStatus('error')
        setOauthError(e instanceof Error ? e.message : '同期に失敗しました')
      }
    },
    [acquireTokenSilently],
  )

  useEffect(() => {
    if (!isOAuthConfigured) return
    const stored = readStoredToken()
    if (!stored) return
    tokenRef.current = stored
    const id = setTimeout(async () => {
      // 起動時に期限が近ければ先取りサイレント更新（失敗時は素のトークンで試す）
      let t: AcquiredToken = stored
      if (t.expiresAt - Date.now() <= TOKEN_REFRESH_AHEAD_MS) {
        const refreshed = await acquireTokenSilently()
        if (refreshed) t = refreshed
      }
      await oauthSyncImpl(t)
    }, 0)
    return () => clearTimeout(id)
  }, [isOAuthConfigured, oauthSyncImpl, acquireTokenSilently])

  // 一定間隔の自動同期（OAuth 経路）
  const oauthLastSyncedAtRef = useRef(oauthLastSyncedAt)
  useEffect(() => {
    oauthLastSyncedAtRef.current = oauthLastSyncedAt
  }, [oauthLastSyncedAt])
  useEffect(() => {
    if (!isOAuthConfigured) return
    const tick = async () => {
      let t = tokenRef.current
      if (!t) return
      // 期限切れ／期限が近い場合は、まずサイレントで取り直してから同期する
      if (t.expiresAt - Date.now() <= TOKEN_REFRESH_AHEAD_MS) {
        const refreshed = await acquireTokenSilently()
        if (!refreshed) return // サイレント失敗時は静かに諦める（次の手動操作で対処）
        t = refreshed
      }
      await oauthSyncImpl(t)
    }
    const intervalId = window.setInterval(() => void tick(), AUTO_SYNC_INTERVAL_MS)
    const onFocus = () => {
      const last = oauthLastSyncedAtRef.current
      if (last && Date.now() - last < AUTO_SYNC_INTERVAL_MS) return
      void tick()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [isOAuthConfigured, oauthSyncImpl, acquireTokenSilently])

  const connectOAuth = useCallback(async () => {
    if (!clientId) {
      setOauthStatus('unavailable')
      return
    }
    setOauthStatus('connecting')
    setOauthError(null)
    try {
      const token = await requestAccessToken({
        clientId,
        scope: YOUTUBE_SCOPE,
        prompt: 'consent',
      })
      tokenRef.current = token
      writeStoredToken(token)
      await oauthSyncImpl(token)
    } catch (e) {
      setOauthStatus('disconnected')
      setOauthError(
        e instanceof Error ? e.message : 'YouTubeとの連携に失敗しました',
      )
    }
  }, [clientId, oauthSyncImpl])

  const syncOAuth = useCallback(async () => {
    let t = tokenRef.current
    // 未連携: ユーザーの明示同意が必要なので consent フローへ
    if (!t) {
      await connectOAuth()
      return
    }
    // 期限切れ／間近: まずサイレント、失敗時のみ consent
    if (t.expiresAt - Date.now() <= TOKEN_REFRESH_AHEAD_MS) {
      const refreshed = await acquireTokenSilently()
      if (refreshed) {
        t = refreshed
      } else {
        tokenRef.current = null
        clearStoredToken()
        await connectOAuth()
        return
      }
    }
    await oauthSyncImpl(t)
  }, [acquireTokenSilently, connectOAuth, oauthSyncImpl])

  const disconnectOAuth = useCallback(async () => {
    const current = tokenRef.current
    tokenRef.current = null
    clearStoredToken()
    setOauthEvents([])
    setOauthLastSyncedAt(null)
    setOauthError(null)
    setOauthStatus(isOAuthConfigured ? 'disconnected' : 'unavailable')
    if (current) {
      try {
        await revokeAccessToken(current.accessToken)
      } catch {
        /* ignore */
      }
    }
  }, [isOAuthConfigured])

  // ---- ユーザーオーバーライド ----
  const { overrides, setOverride, clearOverride } = useYouTubeOverrides()

  // ---- 結合 ----
  const events = useMemo(
    () => applyOverrides(mergeEvents(channelEvents, oauthEvents), overrides),
    [channelEvents, oauthEvents, overrides],
  )

  const value = useMemo(
    () => ({
      events,
      isApiKeyConfigured,
      channels,
      channelStatus,
      channelError,
      channelLastSyncedAt,
      addChannel,
      removeChannel,
      syncChannels,
      isOAuthConfigured,
      oauthStatus,
      oauthError,
      oauthLastSyncedAt,
      connectOAuth,
      syncOAuth,
      disconnectOAuth,
      setOverride,
      clearOverride,
    }),
    [
      events,
      isApiKeyConfigured,
      channels,
      channelStatus,
      channelError,
      channelLastSyncedAt,
      addChannel,
      removeChannel,
      syncChannels,
      isOAuthConfigured,
      oauthStatus,
      oauthError,
      oauthLastSyncedAt,
      connectOAuth,
      syncOAuth,
      disconnectOAuth,
      setOverride,
      clearOverride,
    ],
  )

  return (
    <YouTubeContext.Provider value={value}>{children}</YouTubeContext.Provider>
  )
}

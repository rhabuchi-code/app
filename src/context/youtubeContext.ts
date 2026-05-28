import { createContext } from 'react'
import type { CalendarEvent } from '../types/calendar'
import type { YouTubeEventOverride } from '../utils/youtubeOverrides'

/** OAuth 経路の状態 */
export type OAuthStatus =
  | 'unavailable' // VITE_GOOGLE_CLIENT_ID 未設定
  | 'disconnected' // 未連携
  | 'connecting' // OAuth ポップアップ表示中
  | 'syncing' // API 同期中
  | 'connected' // 連携済み・同期成功
  | 'error' // エラーあり

/** API Key 経路で追跡するチャンネル */
export type TrackedChannel = {
  id: string
  title: string
  handle?: string
  thumbnailUrl?: string
  /** 追加した時刻（並び順のため） */
  addedAt: number
}

/** API Key 経路の状態 */
export type ChannelSyncStatus = 'idle' | 'syncing' | 'error'

export type YouTubeContextValue = {
  /** OAuth + API Key を結合したイベント（CalendarPage 側はこれを使う） */
  events: CalendarEvent[]

  // --- API Key 経路 ---
  isApiKeyConfigured: boolean
  channels: TrackedChannel[]
  channelStatus: ChannelSyncStatus
  channelError: string | null
  channelLastSyncedAt: number | null
  addChannel: (input: string) => Promise<TrackedChannel | null>
  removeChannel: (id: string) => void
  syncChannels: () => Promise<void>

  // --- OAuth 経路 ---
  isOAuthConfigured: boolean
  oauthStatus: OAuthStatus
  oauthError: string | null
  oauthLastSyncedAt: number | null
  connectOAuth: () => Promise<void>
  syncOAuth: () => Promise<void>
  disconnectOAuth: () => Promise<void>

  // --- ユーザーオーバーライド ---
  /**
   * YouTube 由来イベントの一部フィールド（endTime 等）を上書きする。
   * externalId（動画ID）をキーに永続化される。
   */
  setOverride: (externalId: string, patch: YouTubeEventOverride) => void
  /** 指定イベントのオーバーライドをすべて消す */
  clearOverride: (externalId: string) => void
}

export const YouTubeContext = createContext<YouTubeContextValue | null>(null)

import type { CalendarEvent } from '../types/calendar'

/**
 * YouTube 由来のイベントに対する「ユーザーが手で上書きした値」。
 * 同期で取り直された YouTube の元情報には基本書き戻さず、
 * 描画時に CalendarEvent にマージして適用する。
 *
 * - endTime のみ: ユーザーが終了時刻を設定したい場合
 * - title / notes / location も同様に上書き可能（拡張余地）
 */
export type YouTubeEventOverride = Partial<
  Pick<CalendarEvent, 'endTime' | 'title' | 'notes' | 'location'>
>

export type YouTubeOverrideMap = Record<string, YouTubeEventOverride>

/**
 * オーバーライドを CalendarEvent[] にマージする純粋関数。
 * - 対応するキー: `externalId`（YouTube 動画ID）
 * - 値が空文字 / undefined のキーは「未設定に戻す」として扱う
 */
export function applyOverrides(
  events: CalendarEvent[],
  overrides: YouTubeOverrideMap,
): CalendarEvent[] {
  return events.map((event) => {
    if (event.source !== 'youtube' || !event.externalId) return event
    const override = overrides[event.externalId]
    if (!override) return event
    const next: CalendarEvent = { ...event }
    if ('endTime' in override) {
      next.endTime = override.endTime?.trim() || undefined
    }
    if ('title' in override && override.title?.trim()) {
      next.title = override.title.trim()
    }
    if ('notes' in override) {
      next.notes = override.notes?.trim() || undefined
    }
    if ('location' in override) {
      next.location = override.location?.trim() || undefined
    }
    return next
  })
}

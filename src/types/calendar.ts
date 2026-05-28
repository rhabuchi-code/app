export type EventColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'

export type EventSource = 'manual' | 'youtube'

export type CalendarEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  /** 終了時刻（HH:mm）。未設定の場合は開始時刻のみ表示 */
  endTime?: string
  color: EventColor
  location?: string
  notes?: string
  /** 既定値は 'manual'。外部連携由来のイベントには 'youtube' などが入る。 */
  source?: EventSource
  /** 外部システムの一意ID（例: YouTube broadcast id） */
  externalId?: string
  /** タップで開ける外部URL（例: YouTube 視聴ページ） */
  url?: string
}

export type CalendarEventInput = Omit<
  CalendarEvent,
  'id' | 'source' | 'externalId' | 'url'
>

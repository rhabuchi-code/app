import type { CalendarEvent } from '../../types/calendar'
import { toDateKey } from '../../utils/calendar'
import { sortEventsByTime } from '../../utils/events'

const colorMap: Record<CalendarEvent['color'], string> = {
  red: 'bg-[#ff3b30]',
  orange: 'bg-[#ff9500]',
  yellow: 'bg-[#ffcc00]',
  green: 'bg-[#34c759]',
  blue: 'bg-[var(--theme-main)]',
  purple: 'bg-[#af52de]',
}

type UpcomingScheduleProps = {
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (toDateKey(today) === dateKey) return '今日'
  if (toDateKey(tomorrow) === dateKey) return '明日'

  const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  return `${m}月${d}日（${weekday}）`
}

export default function UpcomingSchedule({
  events,
  onSelectEvent,
}: UpcomingScheduleProps) {
  const todayKey = toDateKey(new Date())
  const upcoming = sortEventsByTime(
    events.filter((e) => e.date >= todayKey),
  ).slice(0, 30)

  const grouped = upcoming.reduce<Record<string, CalendarEvent[]>>(
    (acc, event) => {
      if (!acc[event.date]) acc[event.date] = []
      acc[event.date].push(event)
      return acc
    },
    {},
  )

  const dates = Object.keys(grouped).sort()

  return (
    <section className="flex flex-1 flex-col border-t border-[var(--theme-border)] bg-[var(--theme-surface)]">
      <div className="bg-[var(--theme-phone)] px-4 py-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--theme-muted)]">
          今後の予定
        </h2>
      </div>

      <ul className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {dates.length === 0 ? (
          <li className="rounded-xl bg-[var(--theme-phone)] px-4 py-8 text-center text-[15px] text-[var(--theme-muted)]">
            今後の予定はありません
          </li>
        ) : (
          dates.map((dateKey) => (
            <li key={dateKey}>
              <p className="mb-2 text-[13px] font-semibold text-[var(--theme-muted)]">
                {formatDateLabel(dateKey)}
              </p>
              <ul className="space-y-2">
                {grouped[dateKey].map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className="tap-row flex w-full gap-3 rounded-xl bg-[var(--theme-phone)] px-4 py-3 text-left active:bg-[var(--theme-surface)]"
                    >
                      <span
                        className={`mt-1.5 w-1 shrink-0 self-stretch rounded-full ${colorMap[event.color]}`}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-[17px] text-black">
                            {event.title}
                          </p>
                          {event.source === 'youtube' && (
                            <span
                              className="inline-flex shrink-0 items-center rounded-sm bg-[#ff0033] px-1 py-px text-[9px] font-bold uppercase leading-none text-white"
                              aria-label="YouTube配信"
                            >
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-[15px] text-[var(--theme-muted)]">
                          {event.endTime
                            ? `${event.startTime} – ${event.endTime}`
                            : event.startTime}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

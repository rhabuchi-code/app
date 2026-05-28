import type { CalendarEvent } from '../../types/calendar'
import { toDateKey } from '../../utils/calendar'
import { getEventsForDate } from '../../utils/events'

const colorMap: Record<CalendarEvent['color'], string> = {
  red: 'bg-[#ff3b30]',
  orange: 'bg-[#ff9500]',
  yellow: 'bg-[#ffcc00]',
  green: 'bg-[#34c759]',
  blue: 'bg-[var(--theme-main)]',
  purple: 'bg-[#af52de]',
}

type EventListProps = {
  selectedDate: Date
  events: CalendarEvent[]
  onAdd: () => void
  onSelectEvent: (event: CalendarEvent) => void
}

function formatSelectedLabel(date: Date): string {
  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
  const label = `${date.getMonth() + 1}月${date.getDate()}日（${weekday}）`
  return isToday ? `今日 · ${label}` : label
}

export default function EventList({
  selectedDate,
  events,
  onAdd,
  onSelectEvent,
}: EventListProps) {
  const dateKey = toDateKey(selectedDate)
  const dayEvents = getEventsForDate(events, dateKey)

  return (
    <section className="flex flex-1 flex-col border-t border-[var(--theme-border)] bg-[var(--theme-surface)] transition-colors duration-250">
      <div className="flex items-center justify-between bg-[var(--theme-phone)] px-4 py-3 transition-colors duration-250">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--theme-muted)]">
          {formatSelectedLabel(selectedDate)}
        </h2>
        <button
          type="button"
          onClick={onAdd}
          className="tap-strong flex h-8 w-8 items-center justify-center rounded-full bg-[var(--theme-main)] text-white shadow-sm"
          aria-label="予定を追加"
        >
          <PlusIcon />
        </button>
      </div>

      <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-2">
        {dayEvents.length === 0 ? (
          <li className="rounded-xl bg-[var(--theme-phone)] px-4 py-8 text-center">
            <p className="text-[15px] text-[var(--theme-muted)]">予定はありません</p>
            <button
              type="button"
              onClick={onAdd}
              className="tap mt-3 text-[15px] font-medium text-[var(--theme-main)]"
            >
              予定を追加
            </button>
          </li>
        ) : (
          dayEvents.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onSelectEvent(event)}
                className="tap-row flex w-full gap-3 rounded-xl bg-[var(--theme-phone)] px-4 py-3 text-left active:bg-[var(--theme-surface)]"
              >
                <span
                  className={`mt-1.5 h-full w-1 shrink-0 self-stretch rounded-full ${colorMap[event.color]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[17px] font-normal text-black">
                      {event.title}
                    </p>
                    {event.source === 'youtube' && <YouTubeBadge />}
                  </div>
                  <p className="mt-0.5 text-[15px] text-[var(--theme-muted)]">
                    {event.endTime
                      ? `${event.startTime} – ${event.endTime}`
                      : event.startTime}
                  </p>
                  {event.location && (
                    <p className="mt-0.5 truncate text-[15px] text-[var(--theme-muted)]">
                      {event.location}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 3v12M3 9h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function YouTubeBadge() {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-[#ff0033] px-1 py-px text-[9px] font-bold uppercase leading-none text-white"
      aria-label="YouTube配信"
    >
      Live
    </span>
  )
}

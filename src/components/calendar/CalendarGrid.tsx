import { WEEKDAYS_JA, getMonthGrid, toDateKey } from '../../utils/calendar'
import { countEventsByDate } from '../../utils/events'
import CalendarDayCell from './CalendarDayCell'
import type { CalendarEvent } from '../../types/calendar'

type CalendarGridProps = {
  currentMonth: Date
  selectedDate: Date
  today: Date
  events: CalendarEvent[]
  onSelectDate: (date: Date) => void
}

export default function CalendarGrid({
  currentMonth,
  selectedDate,
  today,
  events,
  onSelectDate,
}: CalendarGridProps) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const weeks = getMonthGrid(year, month)
  const eventCounts = countEventsByDate(events)

  return (
    <section className="px-2 pb-2">
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS_JA.map((label, index) => (
          <div
            key={label}
            className={[
              'py-1 text-center text-[11px] font-medium uppercase tracking-wide',
              index === 0 && 'text-[var(--theme-sub)]',
              index === 6 && 'text-[var(--theme-main)]',
              index > 0 && index < 6 && 'text-[var(--theme-muted)]',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {weeks.flat().map((date, i) => (
          <CalendarDayCell
            key={date ? toDateKey(date) : `empty-${i}`}
            date={date}
            selectedDate={selectedDate}
            today={today}
            eventCount={date ? (eventCounts.get(toDateKey(date)) ?? 0) : 0}
            onSelect={onSelectDate}
          />
        ))}
      </div>
    </section>
  )
}

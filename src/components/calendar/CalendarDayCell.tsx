import { isSameDay } from '../../utils/calendar'

type CalendarDayCellProps = {
  date: Date | null
  selectedDate: Date
  today: Date
  eventCount: number
  onSelect: (date: Date) => void
}

export default function CalendarDayCell({
  date,
  selectedDate,
  today,
  eventCount,
  onSelect,
}: CalendarDayCellProps) {
  if (!date) {
    return <div className="aspect-square" />
  }

  const isToday = isSameDay(date, today)
  const isSelected = isSameDay(date, selectedDate)
  const weekday = date.getDay()
  const isSunday = weekday === 0
  const isSaturday = weekday === 6
  const dots = Math.min(eventCount, 3)

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      className="tap-strong flex aspect-square flex-col items-center justify-start pt-1"
    >
      <span
        className={[
          'flex h-8 w-8 items-center justify-center rounded-full text-[17px] font-normal leading-none',
          !isToday && !isSelected && !isSunday && !isSaturday && 'text-black',
          !isToday && isSunday && 'text-[var(--theme-sub)]',
          !isToday && isSaturday && 'text-[var(--theme-main)]',
          isToday && 'bg-[var(--theme-sub)] font-medium text-white',
          isSelected &&
            !isToday &&
            'bg-[var(--theme-main-muted)] font-medium text-[var(--theme-main)]',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {date.getDate()}
      </span>
      <span className="mt-0.5 flex h-1.5 items-center justify-center gap-0.5">
        {Array.from({ length: dots }).map((_, i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full bg-[var(--theme-main)]"
          />
        ))}
      </span>
    </button>
  )
}

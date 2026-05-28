import { formatMonthYear } from '../../utils/calendar'

type CalendarHeaderProps = {
  currentMonth: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

export default function CalendarHeader({
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <header className="border-b border-[var(--theme-border)] px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onToday}
          className="tap rounded-full bg-[var(--theme-main)] px-3 py-1 text-[15px] font-medium text-white shadow-sm"
        >
          今日
        </button>
        <h1 className="text-[17px] font-semibold tracking-tight text-black">
          {formatMonthYear(currentMonth)}
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="前の月"
            className="tap-strong flex h-9 w-9 items-center justify-center rounded-full text-[var(--theme-main)] active:bg-[var(--theme-main-muted)]"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="次の月"
            className="tap-strong flex h-9 w-9 items-center justify-center rounded-full text-[var(--theme-main)] active:bg-[var(--theme-main-muted)]"
          >
            <ChevronRightIcon />
          </button>
        </div>
        </div>
    </header>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden>
      <path
        d="M10 2L2 10l8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden>
      <path
        d="M2 2l8 8-8 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

import { useTheme } from '../../hooks/useTheme'

type Tab = 'today' | 'calendar' | 'inbox'

type CalendarTabBarProps = {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'today', label: '今日' },
  { id: 'calendar', label: 'カレンダー' },
  { id: 'inbox', label: 'インボックス' },
]

export default function CalendarTabBar({
  activeTab,
  onTabChange,
}: CalendarTabBarProps) {
  const { theme } = useTheme()

  return (
    <nav className="border-t border-[var(--theme-border)] bg-[var(--theme-phone)]/95 pb-[max(8px,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl transition-colors duration-250">
      <ul className="flex">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={[
                  'tap flex w-full flex-col items-center gap-0.5 py-1.5 text-[10px]',
                  isActive
                    ? 'font-medium text-[var(--theme-sub)]'
                    : 'text-[var(--theme-muted)]',
                ].join(' ')}
              >
                <TabIcon
                  tab={tab.id}
                  active={isActive}
                  activeColor={theme.sub}
                  inactiveColor="#8e8e93"
                />
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function TabIcon({
  tab,
  active,
  activeColor,
  inactiveColor,
}: {
  tab: Tab
  active: boolean
  activeColor: string
  inactiveColor: string
}) {
  const color = active ? activeColor : inactiveColor

  if (tab === 'today') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M3 9h18" stroke={color} strokeWidth="1.5" />
        <path d="M8 2v4M16 2v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="15" r="2" fill={color} />
      </svg>
    )
  }

  if (tab === 'calendar') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" />
        <path d="M3 9h18" stroke={color} strokeWidth="1.5" />
        <path d="M8 2v4M16 2v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M4 9l8 5 8-5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

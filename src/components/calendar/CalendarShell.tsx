import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from '../../hooks/useTheme'

type CalendarShellProps = {
  children: ReactNode
}

export default function CalendarShell({ children }: CalendarShellProps) {
  const { cssVars } = useTheme()

  return (
    <div
      className="flex min-h-[calc(100dvh-3rem)] w-full max-w-[430px] flex-col overflow-hidden rounded-[2rem] bg-[var(--theme-phone)] shadow-2xl ring-1 ring-black/10 transition-colors duration-250 sm:min-h-[780px]"
      style={cssVars as CSSProperties}
    >
      {children}
    </div>
  )
}

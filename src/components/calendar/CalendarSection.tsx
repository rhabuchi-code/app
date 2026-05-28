import type { ReactNode } from 'react'

/** カレンダー本体（ヘッダー・グリッド）— テーマのカレンダー色が適用される領域 */
export default function CalendarSection({ children }: { children: ReactNode }) {
  return (
    <section className="bg-[var(--theme-calendar)] transition-colors duration-250">
      {children}
    </section>
  )
}

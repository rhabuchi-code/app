import type { ReactNode } from 'react'

/** ブラウザ上の外側（スマホの外枠）— テーマの影響を受けない固定色 */
export default function PhoneViewport({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-[#d1d1d6] px-4 py-6 sm:py-10">
      {children}
    </div>
  )
}

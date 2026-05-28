import { describe, it, expect } from 'vitest'
import {
  WEEKDAYS_JA,
  addMonths,
  formatMonthYear,
  getMonthGrid,
  isSameDay,
  toDateKey,
} from './calendar'

describe('WEEKDAYS_JA', () => {
  it('日曜始まりの7日分', () => {
    expect(WEEKDAYS_JA).toEqual(['日', '月', '火', '水', '木', '金', '土'])
  })
})

describe('formatMonthYear', () => {
  it('日本語フォーマットで返す', () => {
    expect(formatMonthYear(new Date(2026, 4, 20))).toBe('2026年5月')
  })

  it('1月（getMonthは0）も正しく扱う', () => {
    expect(formatMonthYear(new Date(2026, 0, 1))).toBe('2026年1月')
  })

  it('12月も正しく扱う', () => {
    expect(formatMonthYear(new Date(2026, 11, 31))).toBe('2026年12月')
  })
})

describe('toDateKey', () => {
  it('YYYY-MM-DD でゼロ埋めして返す', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('2桁の月日もゼロ埋め不要で同じ形式', () => {
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('isSameDay', () => {
  it('同じ年月日なら true', () => {
    expect(
      isSameDay(new Date(2026, 4, 20, 10, 0), new Date(2026, 4, 20, 23, 59)),
    ).toBe(true)
  })

  it('日が違うと false', () => {
    expect(isSameDay(new Date(2026, 4, 20), new Date(2026, 4, 21))).toBe(false)
  })

  it('月が違うと false', () => {
    expect(isSameDay(new Date(2026, 4, 20), new Date(2026, 5, 20))).toBe(false)
  })

  it('年が違うと false', () => {
    expect(isSameDay(new Date(2026, 4, 20), new Date(2025, 4, 20))).toBe(false)
  })
})

describe('addMonths', () => {
  it('正の値で月を進める', () => {
    expect(addMonths(new Date(2026, 0, 15), 2)).toEqual(new Date(2026, 2, 1))
  })

  it('負の値で月を戻す', () => {
    expect(addMonths(new Date(2026, 0, 15), -1)).toEqual(new Date(2025, 11, 1))
  })

  it('日付は1日にリセットされる', () => {
    expect(addMonths(new Date(2026, 4, 31), 1).getDate()).toBe(1)
  })
})

describe('getMonthGrid', () => {
  it('2026年5月（金曜始まり）を正しく組む', () => {
    const weeks = getMonthGrid(2026, 4)
    expect(weeks).toHaveLength(6)
    expect(weeks[0].slice(0, 5)).toEqual([null, null, null, null, null])
    expect(weeks[0][5]).toEqual(new Date(2026, 4, 1))
    expect(weeks[weeks.length - 1].at(-1)).toBeNull()
  })

  it('各行は必ず7日分', () => {
    const weeks = getMonthGrid(2026, 1)
    for (const week of weeks) {
      expect(week).toHaveLength(7)
    }
  })

  it('日付セルの合計はその月の日数と一致する', () => {
    const weeks = getMonthGrid(2026, 1) // 2026年2月（28日）
    const dayCount = weeks.flat().filter(Boolean).length
    expect(dayCount).toBe(28)
  })

  it('うるう年の2月は29日', () => {
    const weeks = getMonthGrid(2024, 1)
    const dayCount = weeks.flat().filter(Boolean).length
    expect(dayCount).toBe(29)
  })
})

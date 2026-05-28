import { describe, it, expect } from 'vitest'
import type { CalendarEvent, CalendarEventInput } from '../types/calendar'
import {
  compareTime,
  countEventsByDate,
  createEventId,
  getEventsForDate,
  isValidTimeRange,
  sortEventsByTime,
  validateEventInput,
} from './events'

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: overrides.id ?? 'id',
    title: overrides.title ?? 'title',
    date: overrides.date ?? '2026-05-20',
    startTime: overrides.startTime ?? '09:00',
    endTime: overrides.endTime ?? '10:00',
    color: overrides.color ?? 'blue',
    location: overrides.location,
    notes: overrides.notes,
  }
}

describe('createEventId', () => {
  it('呼び出すたびに違うIDを返す', () => {
    expect(createEventId()).not.toBe(createEventId())
  })
})

describe('compareTime', () => {
  it('開始 < 終了で負の値', () => {
    expect(compareTime('09:00', '10:00')).toBeLessThan(0)
  })

  it('同じ時刻で 0', () => {
    expect(compareTime('09:00', '09:00')).toBe(0)
  })

  it('開始 > 終了で正の値', () => {
    expect(compareTime('11:00', '10:00')).toBeGreaterThan(0)
  })
})

describe('isValidTimeRange', () => {
  it('終了が開始より後なら true', () => {
    expect(isValidTimeRange('09:00', '10:00')).toBe(true)
  })

  it('同じ時刻は無効', () => {
    expect(isValidTimeRange('09:00', '09:00')).toBe(false)
  })

  it('終了が開始より前は無効', () => {
    expect(isValidTimeRange('10:00', '09:00')).toBe(false)
  })
})

describe('validateEventInput', () => {
  const base: CalendarEventInput = {
    title: '会議',
    date: '2026-05-20',
    startTime: '09:00',
    endTime: '10:00',
    color: 'blue',
  }

  it('有効な入力ではエラーなし', () => {
    expect(validateEventInput(base)).toEqual({})
  })

  it('タイトルが空白だけだとエラー', () => {
    expect(validateEventInput({ ...base, title: '   ' })).toEqual({
      title: 'タイトルを入力してください',
    })
  })

  it('時刻が逆だとエラー', () => {
    expect(
      validateEventInput({ ...base, startTime: '10:00', endTime: '09:00' }),
    ).toEqual({ time: '終了時刻は開始時刻より後にしてください' })
  })

  it('タイトルと時刻の両方が不正なら両方エラー', () => {
    const errors = validateEventInput({
      ...base,
      title: '',
      startTime: '10:00',
      endTime: '10:00',
    })
    expect(errors.title).toBeDefined()
    expect(errors.time).toBeDefined()
  })

  it('endTime が未指定(undefined)なら時刻エラーは出ない', () => {
    expect(
      validateEventInput({ ...base, endTime: undefined }),
    ).toEqual({})
  })

  it('endTime が空文字でも時刻エラーは出ない', () => {
    expect(validateEventInput({ ...base, endTime: '' })).toEqual({})
  })
})

describe('sortEventsByTime', () => {
  it('日付→開始時刻の順でソートする', () => {
    const events = [
      event({ id: 'a', date: '2026-05-21', startTime: '09:00' }),
      event({ id: 'b', date: '2026-05-20', startTime: '12:00' }),
      event({ id: 'c', date: '2026-05-20', startTime: '08:00' }),
    ]
    const sorted = sortEventsByTime(events)
    expect(sorted.map((e) => e.id)).toEqual(['c', 'b', 'a'])
  })

  it('元の配列を変更しない', () => {
    const events = [
      event({ id: 'a', startTime: '12:00' }),
      event({ id: 'b', startTime: '08:00' }),
    ]
    sortEventsByTime(events)
    expect(events.map((e) => e.id)).toEqual(['a', 'b'])
  })
})

describe('getEventsForDate', () => {
  const events = [
    event({ id: '1', date: '2026-05-20', startTime: '12:00' }),
    event({ id: '2', date: '2026-05-21', startTime: '09:00' }),
    event({ id: '3', date: '2026-05-20', startTime: '09:00' }),
  ]

  it('指定日のイベントのみ抽出する', () => {
    const result = getEventsForDate(events, '2026-05-20')
    expect(result.map((e) => e.id)).toEqual(['3', '1'])
  })

  it('該当なしなら空配列', () => {
    expect(getEventsForDate(events, '2099-12-31')).toEqual([])
  })
})

describe('countEventsByDate', () => {
  it('日付ごとに件数を集計する', () => {
    const result = countEventsByDate([
      event({ id: '1', date: '2026-05-20' }),
      event({ id: '2', date: '2026-05-20' }),
      event({ id: '3', date: '2026-05-21' }),
    ])
    expect(result.get('2026-05-20')).toBe(2)
    expect(result.get('2026-05-21')).toBe(1)
    expect(result.get('2026-05-22')).toBeUndefined()
  })

  it('空配列なら空のMap', () => {
    expect(countEventsByDate([]).size).toBe(0)
  })
})

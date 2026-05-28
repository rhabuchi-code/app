import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEvents } from './useEvents'
import type { CalendarEventInput } from '../types/calendar'

const STORAGE_KEY = 'calendar-events'

const sampleInput: CalendarEventInput = {
  title: '新しい予定',
  date: '2026-05-20',
  startTime: '09:00',
  endTime: '10:00',
  color: 'blue',
}

beforeEach(() => {
  localStorage.clear()
})

describe('useEvents', () => {
  it('初期はモックデータが入っている', () => {
    const { result } = renderHook(() => useEvents())
    expect(result.current.events.length).toBeGreaterThan(0)
  })

  it('localStorageにイベントがあればそれを優先して読み込む', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'stored-1',
          title: '保存済み',
          date: '2026-05-20',
          startTime: '09:00',
          endTime: '10:00',
          color: 'blue',
        },
      ]),
    )

    const { result } = renderHook(() => useEvents())

    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0].id).toBe('stored-1')
  })

  it('addEventでイベントが追加される', () => {
    const { result } = renderHook(() => useEvents())
    const before = result.current.events.length

    let createdId = ''
    act(() => {
      const created = result.current.addEvent(sampleInput)
      createdId = created.id
    })

    expect(result.current.events).toHaveLength(before + 1)
    expect(createdId).toBeTruthy()
    expect(
      result.current.events.find((e) => e.id === createdId)?.title,
    ).toBe('新しい予定')
  })

  it('updateEventで対象IDのイベントだけ更新される', () => {
    const { result } = renderHook(() => useEvents())
    let id = ''
    act(() => {
      id = result.current.addEvent(sampleInput).id
    })

    act(() => {
      result.current.updateEvent(id, { ...sampleInput, title: '更新後' })
    })

    expect(result.current.events.find((e) => e.id === id)?.title).toBe('更新後')
  })

  it('deleteEventでイベントが消える', () => {
    const { result } = renderHook(() => useEvents())
    let id = ''
    act(() => {
      id = result.current.addEvent(sampleInput).id
    })
    const before = result.current.events.length

    act(() => {
      result.current.deleteEvent(id)
    })

    expect(result.current.events).toHaveLength(before - 1)
    expect(result.current.events.find((e) => e.id === id)).toBeUndefined()
  })

  it('getByDateは該当日のイベントを開始時刻順で返す', () => {
    const { result } = renderHook(() => useEvents())

    act(() => {
      result.current.addEvent({ ...sampleInput, date: '2099-01-01', startTime: '15:00', endTime: '16:00', title: 'B' })
      result.current.addEvent({ ...sampleInput, date: '2099-01-01', startTime: '09:00', endTime: '10:00', title: 'A' })
    })

    const list = result.current.getByDate('2099-01-01')
    expect(list.map((e) => e.title)).toEqual(['A', 'B'])
  })

  it('変更後はlocalStorageに書き込まれる', () => {
    const { result } = renderHook(() => useEvents())

    act(() => {
      result.current.addEvent(sampleInput)
    })

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.some((e: { title: string }) => e.title === '新しい予定')).toBe(true)
  })
})

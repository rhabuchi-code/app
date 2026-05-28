import { describe, it, expect } from 'vitest'
import type { CalendarEvent } from '../types/calendar'
import { applyOverrides, type YouTubeOverrideMap } from './youtubeOverrides'

function ytEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: overrides.id ?? 'yt:v1',
    title: overrides.title ?? '配信',
    date: overrides.date ?? '2026-05-20',
    startTime: overrides.startTime ?? '20:00',
    endTime: overrides.endTime,
    color: overrides.color ?? 'red',
    source: 'youtube',
    externalId: overrides.externalId ?? 'v1',
    url: overrides.url ?? 'https://www.youtube.com/watch?v=v1',
    location: overrides.location,
    notes: overrides.notes,
  }
}

describe('applyOverrides', () => {
  it('externalId が一致した YouTube イベントの endTime を上書きする', () => {
    const events: CalendarEvent[] = [ytEvent()]
    const overrides: YouTubeOverrideMap = {
      v1: { endTime: '22:00' },
    }
    const out = applyOverrides(events, overrides)
    expect(out[0].endTime).toBe('22:00')
  })

  it('空文字や undefined の endTime は未設定に戻す', () => {
    const events: CalendarEvent[] = [
      ytEvent({ endTime: '21:00' }),
      ytEvent({ id: 'yt:v2', externalId: 'v2', endTime: '21:00' }),
    ]
    const out = applyOverrides(events, {
      v1: { endTime: '' },
      v2: { endTime: undefined },
    })
    expect(out[0].endTime).toBeUndefined()
    expect(out[1].endTime).toBeUndefined()
  })

  it('YouTube 由来でないイベントは変更しない', () => {
    const manual: CalendarEvent = {
      id: 'manual-1',
      title: '会議',
      date: '2026-05-20',
      startTime: '09:00',
      endTime: '10:00',
      color: 'blue',
    }
    const out = applyOverrides([manual], {
      'manual-1': { endTime: '23:00' },
    })
    expect(out[0]).toEqual(manual)
  })

  it('対応するオーバーライドが無ければ元のまま返す', () => {
    const events = [ytEvent()]
    const out = applyOverrides(events, {})
    expect(out[0]).toEqual(events[0])
  })

  it('複数フィールド(title/notes/location)も上書き可能', () => {
    const events = [ytEvent()]
    const out = applyOverrides(events, {
      v1: { title: '上書きタイトル', notes: 'メモ', location: '場所' },
    })
    expect(out[0].title).toBe('上書きタイトル')
    expect(out[0].notes).toBe('メモ')
    expect(out[0].location).toBe('場所')
  })

  it('title を空文字で上書きしても元タイトルを保持（タイトルは必須のため）', () => {
    const events = [ytEvent({ title: 'もとのタイトル' })]
    const out = applyOverrides(events, { v1: { title: '   ' } })
    expect(out[0].title).toBe('もとのタイトル')
  })
})

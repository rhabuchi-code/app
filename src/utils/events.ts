import type { CalendarEvent, CalendarEventInput } from '../types/calendar'

export function createEventId(): string {
  return crypto.randomUUID()
}

export function compareTime(a: string, b: string): number {
  return a.localeCompare(b)
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  return compareTime(startTime, endTime) < 0
}

export type EventFormErrors = {
  title?: string
  time?: string
}

export function validateEventInput(
  input: CalendarEventInput,
): EventFormErrors {
  const errors: EventFormErrors = {}
  if (!input.title.trim()) {
    errors.title = 'タイトルを入力してください'
  }
  // 終了時刻は任意。指定された場合のみ開始時刻との順序を検証する。
  if (input.endTime && !isValidTimeRange(input.startTime, input.endTime)) {
    errors.time = '終了時刻は開始時刻より後にしてください'
  }
  return errors
}

export function sortEventsByTime(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date)
    if (dateCmp !== 0) return dateCmp
    return a.startTime.localeCompare(b.startTime)
  })
}

export function getEventsForDate(
  events: CalendarEvent[],
  dateKey: string,
): CalendarEvent[] {
  return sortEventsByTime(events.filter((e) => e.date === dateKey))
}

export function countEventsByDate(
  events: CalendarEvent[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const event of events) {
    map.set(event.date, (map.get(event.date) ?? 0) + 1)
  }
  return map
}

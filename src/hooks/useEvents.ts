import { useCallback, useEffect, useState } from 'react'
import { mockEvents } from '../data/mockEvents'
import type { CalendarEvent, CalendarEventInput } from '../types/calendar'
import { createEventId, getEventsForDate } from '../utils/events'

const STORAGE_KEY = 'calendar-events'

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CalendarEvent[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore
  }
  return mockEvents
}

function saveEvents(events: CalendarEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // ignore
  }
}

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(loadEvents)

  useEffect(() => {
    saveEvents(events)
  }, [events])

  const addEvent = useCallback((input: CalendarEventInput) => {
    const event: CalendarEvent = { ...input, id: createEventId() }
    setEvents((prev) => [...prev, event])
    return event
  }, [])

  const updateEvent = useCallback(
    (id: string, input: CalendarEventInput) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...input, id } : e)),
      )
    },
    [],
  )

  const deleteEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const getByDate = useCallback(
    (dateKey: string) => getEventsForDate(events, dateKey),
    [events],
  )

  return { events, addEvent, updateEvent, deleteEvent, getByDate }
}

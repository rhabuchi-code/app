import { useMemo, useState } from 'react'
import PhoneViewport from '../components/calendar/PhoneViewport'
import CalendarShell from '../components/calendar/CalendarShell'
import CalendarSection from '../components/calendar/CalendarSection'
import CalendarHeader from '../components/calendar/CalendarHeader'
import ThemePicker from '../components/calendar/ThemePicker'
import YouTubeSyncCard from '../components/calendar/YouTubeSyncCard'
import CalendarGrid from '../components/calendar/CalendarGrid'
import EventList from '../components/calendar/EventList'
import UpcomingSchedule from '../components/calendar/UpcomingSchedule'
import CalendarTabBar from '../components/calendar/CalendarTabBar'
import EventFormSheet from '../components/calendar/EventFormSheet'
import { useEvents } from '../hooks/useEvents'
import { useYouTube } from '../hooks/useYouTube'
import { addMonths, toDateKey } from '../utils/calendar'
import type { CalendarEvent, CalendarEventInput } from '../types/calendar'

type SheetState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; event: CalendarEvent }

export default function CalendarPage() {
  const today = useMemo(() => new Date(), [])
  const { events: manualEvents, addEvent, updateEvent, deleteEvent } = useEvents()
  const { events: youtubeEvents, setOverride } = useYouTube()

  /**
   * 手動イベントと YouTube 由来イベントをマージ。
   * 同一 id 衝突は基本起きない（YouTube側は `yt:<id>` プレフィックス付き）が、
   * 念のため YouTube 側を優先（読み取り専用の真実の値）にする。
   */
  const events = useMemo<CalendarEvent[]>(() => {
    const map = new Map<string, CalendarEvent>()
    for (const e of manualEvents) map.set(e.id, e)
    for (const e of youtubeEvents) map.set(e.id, e)
    return Array.from(map.values())
  }, [manualEvents, youtubeEvents])

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDate, setSelectedDate] = useState(() => new Date(today))
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'inbox'>(
    'calendar',
  )
  const [sheet, setSheet] = useState<SheetState>({ open: false })

  const handleTabChange = (tab: 'today' | 'calendar' | 'inbox') => {
    setActiveTab(tab)
    if (tab === 'today') {
      const now = new Date()
      setSelectedDate(now)
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    }
  }

  const handleToday = () => {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(now)
    setActiveTab('calendar')
  }

  const openCreate = () => setSheet({ open: true, mode: 'create' })

  /**
   * 編集シートを開く。YouTube 由来の場合も同じシートを使うが、
   * 限定編集モード（endTime のみ編集可、保存はオーバーライドとして反映）。
   */
  const handleSelectEvent = (event: CalendarEvent) => {
    setSheet({ open: true, mode: 'edit', event })
  }

  const handleSave = (input: CalendarEventInput) => {
    if (sheet.open && sheet.mode === 'edit') {
      const target = sheet.event
      if (target.source === 'youtube' && target.externalId) {
        // YouTube 由来は upstream を上書きせず、endTime のみオーバーライド層に保存。
        setOverride(target.externalId, { endTime: input.endTime })
      } else {
        updateEvent(target.id, input)
      }
    } else {
      addEvent(input)
    }
  }

  const showCalendarSection = activeTab === 'calendar'

  return (
    <PhoneViewport>
      <CalendarShell>
        {showCalendarSection && (
          <CalendarSection>
            <CalendarHeader
              currentMonth={currentMonth}
              onPrevMonth={() => setCurrentMonth((m) => addMonths(m, -1))}
              onNextMonth={() => setCurrentMonth((m) => addMonths(m, 1))}
              onToday={handleToday}
            />

            <ThemePicker />

            <YouTubeSyncCard />

            <CalendarGrid
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              today={today}
              events={events}
              onSelectDate={setSelectedDate}
            />
          </CalendarSection>
        )}

        {activeTab === 'calendar' && (
          <EventList
            selectedDate={selectedDate}
            events={events}
            onAdd={openCreate}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {activeTab === 'today' && (
          <EventList
            selectedDate={today}
            events={events}
            onAdd={openCreate}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {activeTab === 'inbox' && (
          <UpcomingSchedule
            events={events}
            onSelectEvent={handleSelectEvent}
          />
        )}

        <CalendarTabBar activeTab={activeTab} onTabChange={handleTabChange} />

        {sheet.open &&
          (() => {
            const isYouTube =
              sheet.mode === 'edit' && sheet.event.source === 'youtube'
            return (
              <EventFormSheet
                key={
                  sheet.mode === 'edit'
                    ? sheet.event.id
                    : `create-${toDateKey(selectedDate)}`
                }
                open
                mode={sheet.mode === 'edit' ? 'edit' : 'create'}
                defaultDate={selectedDate}
                event={sheet.mode === 'edit' ? sheet.event : undefined}
                onClose={() => setSheet({ open: false })}
                onSave={handleSave}
                onDelete={
                  sheet.mode === 'edit' && !isYouTube
                    ? (id) => deleteEvent(id)
                    : undefined
                }
                title={isYouTube ? '配信予定' : undefined}
                readOnly={
                  isYouTube
                    ? {
                        title: true,
                        date: true,
                        startTime: true,
                        color: true,
                        location: true,
                        notes: true,
                      }
                    : undefined
                }
                secondaryAction={
                  isYouTube && sheet.mode === 'edit' && sheet.event.url
                    ? {
                        label: 'YouTubeで開く',
                        onClick: () => {
                          window.open(
                            sheet.event.url,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        },
                      }
                    : undefined
                }
              />
            )
          })()}
      </CalendarShell>
    </PhoneViewport>
  )
}

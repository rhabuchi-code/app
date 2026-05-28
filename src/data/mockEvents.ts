import type { CalendarEvent } from '../types/calendar'

const today = new Date()
const year = today.getFullYear()
const month = today.getMonth() + 1
const pad = (n: number) => String(n).padStart(2, '0')
const d = (day: number) => `${year}-${pad(month)}-${pad(day)}`

export const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'チームミーティング',
    date: d(today.getDate()),
    startTime: '10:00',
    endTime: '11:00',
    color: 'blue',
    location: '会議室A',
  },
  {
    id: '2',
    title: 'ランチ',
    date: d(today.getDate()),
    startTime: '12:30',
    endTime: '13:30',
    color: 'green',
  },
  {
    id: '3',
    title: 'デザインレビュー',
    date: d(today.getDate() + 1),
    startTime: '14:00',
    endTime: '15:30',
    color: 'purple',
    location: 'オンライン',
  },
  {
    id: '4',
    title: 'ジム',
    date: d(today.getDate() + 2),
    startTime: '19:00',
    endTime: '20:00',
    color: 'orange',
  },
  {
    id: '5',
    title: '歯医者',
    date: d(today.getDate() + 5),
    startTime: '09:00',
    endTime: '10:00',
    color: 'red',
  },
]

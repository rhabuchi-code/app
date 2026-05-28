import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  fetchPublicUpcomingByChannel,
  fetchUpcomingBroadcasts,
  resolveChannelByHandle,
  resolveChannelById,
  splitLocalDateTime,
  toCalendarEvents,
  YouTubeApiError,
  type YouTubeLiveBroadcast,
} from './youtube'

describe('splitLocalDateTime', () => {
  it('ISO 文字列をローカル日付・時刻に分解する', () => {
    const iso = new Date(2026, 4, 10, 14, 30).toISOString()
    const out = splitLocalDateTime(iso)
    expect(out.date).toBe('2026-05-10')
    expect(out.time).toBe('14:30')
  })

  it('1桁の月日や時刻も0埋めされる', () => {
    const iso = new Date(2026, 0, 3, 7, 5).toISOString()
    const out = splitLocalDateTime(iso)
    expect(out.date).toBe('2026-01-03')
    expect(out.time).toBe('07:05')
  })
})

describe('toCalendarEvents', () => {
  // 全テストで決定論的にする基準時刻（テスト内の "未来" は基準時刻より後）
  const FIXED_NOW = new Date(2026, 0, 1, 0, 0)

  it('scheduledStartTime が無い項目は除外される', () => {
    const broadcasts: YouTubeLiveBroadcast[] = [
      { id: 'a', snippet: { title: 'no time' } },
      {
        id: 'b',
        snippet: {
          title: 'with time',
          scheduledStartTime: new Date(2026, 5, 1, 12, 0).toISOString(),
        },
      },
    ]
    const events = toCalendarEvents(broadcasts, { now: FIXED_NOW })
    expect(events).toHaveLength(1)
    expect(events[0].externalId).toBe('b')
  })

  it('現在より過去の scheduledStartTime を持つ項目は除外される', () => {
    const events = toCalendarEvents(
      [
        {
          id: 'past',
          snippet: {
            title: '過去配信',
            scheduledStartTime: new Date(2025, 11, 31, 23, 59).toISOString(),
          },
        },
        {
          id: 'future',
          snippet: {
            title: '未来配信',
            scheduledStartTime: new Date(2026, 5, 1, 12, 0).toISOString(),
          },
        },
      ],
      { now: FIXED_NOW },
    )
    expect(events.map((e) => e.externalId)).toEqual(['future'])
  })

  it('YouTube のデフォルトブロードキャスト(1970-01-01)を除外する', () => {
    const events = toCalendarEvents(
      [
        {
          id: 'default-broadcast',
          snippet: {
            title: '(default)',
            scheduledStartTime: '1970-01-01T00:00:00.000Z',
          },
        },
      ],
      { now: FIXED_NOW },
    )
    expect(events).toHaveLength(0)
  })

  it('不正な ISO 文字列は除外される', () => {
    const events = toCalendarEvents(
      [
        {
          id: 'broken',
          snippet: {
            title: '壊れた日付',
            scheduledStartTime: 'not-a-date',
          },
        },
      ],
      { now: FIXED_NOW },
    )
    expect(events).toHaveLength(0)
  })

  it('終了時刻が同日内なら採用、別日なら endTime は未設定にしてメモへ補足する', () => {
    const start = new Date(2026, 5, 1, 10, 0).toISOString()
    const sameDayEnd = new Date(2026, 5, 1, 11, 30).toISOString()
    const nextDayEnd = new Date(2026, 5, 2, 1, 0).toISOString()

    const events = toCalendarEvents(
      [
        {
          id: 'x',
          snippet: {
            title: 'same-day',
            scheduledStartTime: start,
            scheduledEndTime: sameDayEnd,
          },
        },
        {
          id: 'y',
          snippet: {
            title: 'cross-day',
            scheduledStartTime: start,
            scheduledEndTime: nextDayEnd,
          },
        },
      ],
      { now: FIXED_NOW },
    )

    expect(events[0].endTime).toBe('11:30')
    expect(events[0].notes).toBeUndefined()

    expect(events[1].endTime).toBeUndefined()
    expect(events[1].notes).toContain('終了予定')
  })

  it('終了時刻が無い場合は endTime を未設定にする（勝手に +1h で埋めない）', () => {
    const start = new Date(2026, 5, 1, 23, 30).toISOString()
    const events = toCalendarEvents(
      [
        {
          id: 'wrap',
          snippet: {
            title: '深夜配信',
            scheduledStartTime: start,
          },
        },
      ],
      { now: FIXED_NOW },
    )
    expect(events[0].startTime).toBe('23:30')
    expect(events[0].endTime).toBeUndefined()
  })

  it('CalendarEvent としての必須フィールドを満たす', () => {
    const events = toCalendarEvents(
      [
        {
          id: 'abc123',
          snippet: {
            title: ' 配信タイトル ',
            description: '説明テキスト',
            scheduledStartTime: new Date(2026, 5, 10, 20, 0).toISOString(),
          },
        },
      ],
      { now: FIXED_NOW },
    )
    const e = events[0]
    expect(e.id).toBe('yt:abc123')
    expect(e.externalId).toBe('abc123')
    expect(e.title).toBe('配信タイトル')
    expect(e.url).toBe('https://www.youtube.com/watch?v=abc123')
    expect(e.source).toBe('youtube')
    expect(e.color).toBe('red')
    expect(e.location).toBe('YouTube Live')
    expect(e.notes).toBe('説明テキスト')
  })

  it('タイトル未設定の場合はフォールバックを用いる', () => {
    const events = toCalendarEvents(
      [
        {
          id: 'no-title',
          snippet: {
            scheduledStartTime: new Date(2026, 5, 10, 20, 0).toISOString(),
          },
        },
      ],
      { now: FIXED_NOW },
    )
    expect(events[0].title).toBe('(無題の配信)')
  })
})

describe('fetchUpcomingBroadcasts', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('正常系: items を返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ items: [{ id: 'A', snippet: { title: 'A' } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const items = await fetchUpcomingBroadcasts('token')
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('A')

    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('broadcastStatus=upcoming')
    // filter パラメータは排他なので mine は付かない
    expect(calledUrl).not.toContain('mine=')
    const init = fetchMock.mock.calls[0][1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer token')
  })

  it('HTTP エラー時は YouTubeApiError を投げ status を保持する', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }),
      ),
    )
    await expect(fetchUpcomingBroadcasts('expired')).rejects.toMatchObject({
      name: 'YouTubeApiError',
      status: 401,
    })
    await expect(fetchUpcomingBroadcasts('expired')).rejects.toBeInstanceOf(
      YouTubeApiError,
    )
  })
})

describe('resolveChannelByHandle / resolveChannelById', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ハンドル解決: API Key と @handle を渡し、整形された ChannelInfo を返す', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 'UC123',
              snippet: {
                title: 'テストチャンネル',
                customUrl: '@test',
                thumbnails: {
                  medium: { url: 'https://example.com/m.jpg' },
                  default: { url: 'https://example.com/d.jpg' },
                },
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const info = await resolveChannelByHandle('API_KEY', 'test')
    expect(info).toEqual({
      id: 'UC123',
      title: 'テストチャンネル',
      handle: '@test',
      thumbnailUrl: 'https://example.com/m.jpg',
    })

    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('forHandle=%40test')
    expect(calledUrl).toContain('key=API_KEY')
  })

  it('ハンドル解決: @ プレフィックスが無くても正しく付与される', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    await resolveChannelByHandle('API_KEY', '@withAt')
    const calledUrl = fetchMock.mock.calls[0][0] as string
    expect(calledUrl).toContain('forHandle=%40withAt')
  })

  it('ID 解決: items が空のときは null を返す', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 })),
    )
    const info = await resolveChannelById('API_KEY', 'UC_not_exist')
    expect(info).toBeNull()
  })
})

describe('fetchPublicUpcomingByChannel', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('search → videos の2段呼び出しで CalendarEvent を返す', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const fetchMock = vi
      .fn()
      // 1段目: search.list
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ items: [{ id: { videoId: 'vid1' } }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      // 2段目: videos.list
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: 'vid1',
                snippet: { title: '公開予定配信', description: '説明' },
                liveStreamingDetails: { scheduledStartTime: future },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    const events = await fetchPublicUpcomingByChannel('API_KEY', 'UC123')
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      id: 'yt:vid1',
      title: '公開予定配信',
      source: 'youtube',
      externalId: 'vid1',
      url: 'https://www.youtube.com/watch?v=vid1',
    })

    const firstUrl = fetchMock.mock.calls[0][0] as string
    expect(firstUrl).toContain('/search?')
    expect(firstUrl).toContain('eventType=upcoming')
    expect(firstUrl).toContain('channelId=UC123')

    const secondUrl = fetchMock.mock.calls[1][0] as string
    expect(secondUrl).toContain('/videos?')
    expect(secondUrl).toContain('id=vid1')
    expect(secondUrl).toContain('part=snippet%2CliveStreamingDetails')
  })

  it('search の items が空なら videos は呼ばずに空配列を返す', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const events = await fetchPublicUpcomingByChannel('API_KEY', 'UC123')
    expect(events).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

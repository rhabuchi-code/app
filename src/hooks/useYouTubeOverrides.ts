import { useCallback, useEffect, useState } from 'react'
import type {
  YouTubeEventOverride,
  YouTubeOverrideMap,
} from '../utils/youtubeOverrides'

const STORAGE_KEY = 'calendar-youtube-overrides'

function load(): YouTubeOverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
    ) {
      return parsed as YouTubeOverrideMap
    }
  } catch {
    /* ignore */
  }
  return {}
}

function save(map: YouTubeOverrideMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

/**
 * YouTube 由来イベントの「ユーザー上書き値」を localStorage に永続化するフック。
 * 上書きは Partial で、フィールド単位の追加・除去・部分編集をサポート。
 */
export function useYouTubeOverrides() {
  const [overrides, setOverrides] = useState<YouTubeOverrideMap>(load)

  useEffect(() => {
    save(overrides)
  }, [overrides])

  const setOverride = useCallback(
    (externalId: string, patch: YouTubeEventOverride) => {
      setOverrides((prev) => {
        const current = prev[externalId] ?? {}
        const merged: YouTubeEventOverride = { ...current, ...patch }
        // 値が無くなったキーは削除し、何も残らなければエントリごと削除
        for (const key of Object.keys(merged) as (keyof YouTubeEventOverride)[]) {
          const v = merged[key]
          if (v === undefined || v === '') delete merged[key]
        }
        const next = { ...prev }
        if (Object.keys(merged).length === 0) {
          delete next[externalId]
        } else {
          next[externalId] = merged
        }
        return next
      })
    },
    [],
  )

  const clearOverride = useCallback((externalId: string) => {
    setOverrides((prev) => {
      if (!(externalId in prev)) return prev
      const next = { ...prev }
      delete next[externalId]
      return next
    })
  }, [])

  return { overrides, setOverride, clearOverride }
}

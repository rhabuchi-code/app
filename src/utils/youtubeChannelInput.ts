/**
 * ユーザー入力から YouTube チャンネルの問い合わせ先を判定する純粋関数。
 *
 * 想定される入力例:
 *   - "@SomeChannel"
 *   - "SomeChannel"
 *   - "UC1234567890abcdefghij_-"
 *   - "https://www.youtube.com/@SomeChannel"
 *   - "https://www.youtube.com/channel/UC1234567890abcdefghij_-"
 *   - "https://youtu.be/..." はチャンネル検索に向かないので unknown
 */

export type ChannelLookupTarget =
  | { kind: 'handle'; handle: string }
  | { kind: 'id'; id: string }
  | { kind: 'unknown' }

const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{20,}$/
const HANDLE_BODY_RE = /^[A-Za-z0-9._-]{3,}$/

function fromUrl(url: URL): ChannelLookupTarget | null {
  if (!/(^|\.)youtube\.com$/.test(url.hostname)) return null

  const handleMatch = url.pathname.match(/^\/@([A-Za-z0-9._-]+)/)
  if (handleMatch) {
    return { kind: 'handle', handle: `@${handleMatch[1]}` }
  }

  const idMatch = url.pathname.match(/^\/channel\/(UC[A-Za-z0-9_-]+)/)
  if (idMatch) {
    return { kind: 'id', id: idMatch[1] }
  }

  return null
}

export function parseChannelInput(input: string): ChannelLookupTarget {
  const trimmed = input.trim()
  if (!trimmed) return { kind: 'unknown' }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = fromUrl(new URL(trimmed))
      if (parsed) return parsed
    } catch {
      // fallthrough
    }
    return { kind: 'unknown' }
  }

  if (trimmed.startsWith('@')) {
    const body = trimmed.slice(1)
    if (HANDLE_BODY_RE.test(body)) {
      return { kind: 'handle', handle: `@${body}` }
    }
    return { kind: 'unknown' }
  }

  if (CHANNEL_ID_RE.test(trimmed)) {
    return { kind: 'id', id: trimmed }
  }

  if (HANDLE_BODY_RE.test(trimmed)) {
    return { kind: 'handle', handle: `@${trimmed}` }
  }

  return { kind: 'unknown' }
}

/**
 * Google Identity Services (GIS) 経由で OAuth 2.0 アクセストークンを取得する薄いラッパー。
 *
 * - PKCE 不要の Token Client（implicit 相当）で、SPA のみで完結する読み取り操作向け。
 * - アクセストークンは返却するだけで永続化しない。呼び出し側で sessionStorage に短期保持する想定。
 *
 * 参考:
 *   https://developers.google.com/identity/oauth2/web/guides/use-token-model
 */

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

type TokenResponse = {
  access_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}

type TokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void
  callback: (resp: TokenResponse) => void
}

type GoogleNs = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        prompt?: string
        callback: (resp: TokenResponse) => void
      }) => TokenClient
      revoke: (token: string, done?: () => void) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleNs
  }
}

let scriptPromise: Promise<void> | null = null

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not available'))
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve()
  }
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Identity Services')),
        { once: true },
      )
      return
    }
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export type AcquiredToken = {
  accessToken: string
  /** ローカル時刻のミリ秒で有効期限。少し短めに丸めて保持する。 */
  expiresAt: number
  scope: string
}

export async function requestAccessToken(params: {
  clientId: string
  scope: string
  /** 'consent' で再同意、'' で既存セッションがあれば無音 */
  prompt?: '' | 'consent' | 'none'
}): Promise<AcquiredToken> {
  await loadGoogleIdentityScript()
  const g = window.google
  if (!g) throw new Error('Google Identity Services not available')

  return new Promise<AcquiredToken>((resolve, reject) => {
    const client = g.accounts.oauth2.initTokenClient({
      client_id: params.clientId,
      scope: params.scope,
      prompt: params.prompt ?? '',
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error_description ||
                resp.error ||
                'Failed to acquire access token',
            ),
          )
          return
        }
        const lifetimeMs = (resp.expires_in ?? 3600) * 1000
        // 30 秒のバッファ
        resolve({
          accessToken: resp.access_token,
          expiresAt: Date.now() + Math.max(0, lifetimeMs - 30_000),
          scope: resp.scope ?? params.scope,
        })
      },
    })
    try {
      client.requestAccessToken({ prompt: params.prompt ?? '' })
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)))
    }
  })
}

export async function revokeAccessToken(token: string): Promise<void> {
  try {
    await loadGoogleIdentityScript()
  } catch {
    return
  }
  const g = window.google
  if (!g) return
  await new Promise<void>((resolve) => {
    g.accounts.oauth2.revoke(token, () => resolve())
  })
}

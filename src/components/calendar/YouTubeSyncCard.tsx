import { useState, type FormEvent } from 'react'
import { useYouTube } from '../../hooks/useYouTube'

function formatRelativeTime(ms: number): string {
  const diff = Math.max(0, Date.now() - ms)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'たった今'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}時間前`
  const day = Math.floor(hour / 24)
  return `${day}日前`
}

export default function YouTubeSyncCard() {
  const {
    isApiKeyConfigured,
    channels,
    channelStatus,
    channelError,
    channelLastSyncedAt,
    addChannel,
    removeChannel,
    syncChannels,
    isOAuthConfigured,
    oauthStatus,
    oauthError,
    oauthLastSyncedAt,
    connectOAuth,
    syncOAuth,
    disconnectOAuth,
  } = useYouTube()

  const [input, setInput] = useState('')
  const channelBusy = channelStatus === 'syncing'
  const oauthBusy =
    oauthStatus === 'connecting' || oauthStatus === 'syncing'
  const isOAuthConnected =
    oauthStatus === 'connected' || oauthStatus === 'syncing'

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (channelBusy) return
    const trimmed = input.trim()
    if (!trimmed) return
    const added = await addChannel(trimmed)
    if (added) setInput('')
  }

  if (!isApiKeyConfigured && !isOAuthConfigured) {
    return (
      <section
        className="border-b border-[var(--theme-border)] px-4 py-3"
        aria-label="YouTube連携"
      >
        <Header />
        <UnconfiguredHint />
      </section>
    )
  }

  return (
    <section
      className="space-y-3 border-b border-[var(--theme-border)] px-4 py-3"
      aria-label="YouTube連携"
    >
      <Header
        right={
          channelLastSyncedAt ? (
            <span className="text-[11px] text-[var(--theme-muted)]">
              {formatRelativeTime(channelLastSyncedAt)}に同期
            </span>
          ) : null
        }
      />

      {isApiKeyConfigured && (
        <div className="space-y-2">
          {channels.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {channels.map((c) => (
                <li key={c.id}>
                  <ChannelChip
                    title={c.title}
                    thumbnailUrl={c.thumbnailUrl}
                    onRemove={() => removeChannel(c.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[var(--theme-muted)]">
              チャンネルURL（例:{' '}
              <code className="rounded bg-[var(--theme-surface)] px-1">
                @ChannelName
              </code>
              ）を追加すると、公開された配信予定がカレンダーに反映されます。
            </p>
          )}

          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="@ChannelName または URL"
              className="flex-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-calendar)] px-3 py-2 text-[14px] outline-none focus:border-[var(--theme-main)]"
              disabled={channelBusy}
            />
            <button
              type="submit"
              disabled={channelBusy || !input.trim()}
              className="tap rounded-full bg-[#ff0033] px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {channelBusy && channels.length > 0 ? '…' : '追加'}
            </button>
          </form>

          {channels.length > 0 && (
            <button
              type="button"
              onClick={() => void syncChannels()}
              disabled={channelBusy}
              className="tap rounded-full bg-[var(--theme-main-muted)] px-3 py-1 text-[12px] font-medium text-[var(--theme-main)] disabled:opacity-60"
            >
              {channelBusy ? '同期中…' : 'すべて更新'}
            </button>
          )}

          {channelError && (
            <p
              role="alert"
              className="rounded-md bg-[#ff3b3010] px-2 py-1.5 text-[12px] text-[#ff3b30]"
            >
              {channelError}
            </p>
          )}
        </div>
      )}

      {isOAuthConfigured && (
        <div className="space-y-2 border-t border-[var(--theme-border)] pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-muted)]">
            自分のチャンネル（非公開も含む）
          </p>
          {!isOAuthConnected ? (
            <button
              type="button"
              onClick={() => void connectOAuth()}
              disabled={oauthBusy}
              className="tap inline-flex items-center gap-2 rounded-full bg-black px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-60"
            >
              {oauthStatus === 'connecting'
                ? '連携中…'
                : 'Google アカウントを連携'}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-[var(--theme-muted)]">
                {oauthStatus === 'syncing'
                  ? '同期中…'
                  : oauthLastSyncedAt
                    ? `${formatRelativeTime(oauthLastSyncedAt)}に同期`
                    : '連携済み'}
              </span>
              <button
                type="button"
                onClick={() => void syncOAuth()}
                disabled={oauthBusy}
                className="tap rounded-full bg-[var(--theme-main-muted)] px-3 py-1 text-[12px] font-medium text-[var(--theme-main)] disabled:opacity-60"
              >
                更新
              </button>
              <button
                type="button"
                onClick={() => void disconnectOAuth()}
                disabled={oauthBusy}
                className="tap rounded-full px-3 py-1 text-[12px] text-[var(--theme-muted)] disabled:opacity-60"
              >
                解除
              </button>
            </div>
          )}
          {oauthError && (
            <p
              role="alert"
              className="rounded-md bg-[#ff3b3010] px-2 py-1.5 text-[12px] text-[#ff3b30]"
            >
              {oauthError}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function Header({ right }: { right?: React.ReactNode } = {}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <YouTubeIcon />
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--theme-muted)]">
          YouTubeライブ
        </p>
      </div>
      {right}
    </div>
  )
}

function ChannelChip({
  title,
  thumbnailUrl,
  onRemove,
}: {
  title: string
  thumbnailUrl?: string
  onRemove: () => void
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-surface)] py-1 pl-1 pr-2 text-[12px]">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="h-5 w-5 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="h-5 w-5 rounded-full bg-[var(--theme-main-muted)]" />
      )}
      <span className="max-w-[120px] truncate text-black">{title}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${title} を削除`}
        className="tap-strong flex h-4 w-4 items-center justify-center rounded-full text-[var(--theme-muted)] hover:text-[#ff3b30]"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path
            d="M1 1l8 8M9 1L1 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}

function UnconfiguredHint() {
  return (
    <p className="mt-2 text-[12px] leading-relaxed text-[var(--theme-muted)]">
      YouTube連携を有効にするには、Google Cloud Console で API Key を発行し、
      <code className="mx-1 rounded bg-[var(--theme-surface)] px-1">
        VITE_GOOGLE_API_KEY
      </code>
      を <code className="rounded bg-[var(--theme-surface)] px-1">.env.local</code>{' '}
      に設定してください。詳細は README を参照してください。
    </p>
  )
}

function YouTubeIcon() {
  return (
    <svg width="18" height="13" viewBox="0 0 24 17" aria-hidden>
      <path
        d="M23.5 2.6c-.3-1.1-1.1-1.9-2.1-2.2C19.4 0 12 0 12 0S4.6 0 2.6.4C1.6.7.8 1.5.5 2.6 0 4.6 0 8.5 0 8.5s0 3.9.5 5.9c.3 1.1 1.1 1.9 2.1 2.2 2 .4 9.4.4 9.4.4s7.4 0 9.4-.4c1-.3 1.9-1.1 2.1-2.2.5-2 .5-5.9.5-5.9s0-3.9-.5-5.9z"
        fill="#ff0033"
      />
      <path d="M9.5 12.3l6.3-3.8-6.3-3.8v7.6z" fill="#fff" />
    </svg>
  )
}

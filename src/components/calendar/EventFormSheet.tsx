import { useState, type FormEvent, type ReactNode } from 'react'
import type { CalendarEvent, CalendarEventInput, EventColor } from '../../types/calendar'
import { toDateKey } from '../../utils/calendar'
import { validateEventInput, type EventFormErrors } from '../../utils/events'

const colorOptions: { value: EventColor; label: string; className: string }[] = [
  { value: 'red', label: '赤', className: 'bg-[#ff3b30]' },
  { value: 'orange', label: 'オレンジ', className: 'bg-[#ff9500]' },
  { value: 'yellow', label: '黄', className: 'bg-[#ffcc00]' },
  { value: 'green', label: '緑', className: 'bg-[#34c759]' },
  { value: 'blue', label: '青', className: 'bg-[var(--theme-main)]' },
  { value: 'purple', label: '紫', className: 'bg-[#af52de]' },
]

type ReadOnlyFlags = {
  title?: boolean
  date?: boolean
  startTime?: boolean
  endTime?: boolean
  color?: boolean
  location?: boolean
  notes?: boolean
}

type SecondaryAction = {
  label: string
  onClick: () => void
}

type EventFormSheetProps = {
  open: boolean
  mode: 'create' | 'edit'
  defaultDate: Date
  event?: CalendarEvent
  onClose: () => void
  onSave: (input: CalendarEventInput) => void
  onDelete?: (id: string) => void
  /**
   * 編集不可にしたいフィールド（YouTube 由来の限定編集モードで使用）。
   * endTime は通常編集可で、限定モードでも endTime は許可される想定。
   */
  readOnly?: ReadOnlyFlags
  /** モーダルのタイトル（指定が無ければ mode から決定） */
  title?: string
  /** 削除ボタンの代わりに表示する補助アクション（例: YouTubeで開く） */
  secondaryAction?: SecondaryAction
}

function buildInitial(
  defaultDate: Date,
  event?: CalendarEvent,
): CalendarEventInput {
  if (event) {
    return {
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime ?? '',
      color: event.color,
      location: event.location ?? '',
      notes: event.notes ?? '',
    }
  }
  return {
    title: '',
    date: toDateKey(defaultDate),
    startTime: '09:00',
    endTime: '10:00',
    color: 'blue',
    location: '',
    notes: '',
  }
}

export default function EventFormSheet({
  open,
  mode,
  defaultDate,
  event,
  onClose,
  onSave,
  onDelete,
  readOnly,
  title,
  secondaryAction,
}: EventFormSheetProps) {
  const [form, setForm] = useState<CalendarEventInput>(() =>
    buildInitial(defaultDate, event),
  )
  const [errors, setErrors] = useState<EventFormErrors>({})

  if (!open) return null

  const ro = readOnly ?? {}
  const headerTitle =
    title ?? (mode === 'create' ? '予定を追加' : '予定を編集')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload: CalendarEventInput = {
      ...form,
      title: form.title.trim(),
      endTime: form.endTime?.trim() || undefined,
      location: form.location?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    }
    const nextErrors = validateEventInput(payload)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    onSave(payload)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="閉じる"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-2xl bg-[var(--theme-phone)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="tap rounded-md px-2 py-1 text-[17px] text-[var(--theme-main)]"
          >
            キャンセル
          </button>
          <h2 id="event-form-title" className="text-[17px] font-semibold">
            {headerTitle}
          </h2>
          <button
            type="submit"
            className="tap rounded-md px-2 py-1 text-[17px] font-semibold text-[var(--theme-main)]"
          >
            保存
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-x-hidden overflow-y-auto px-4 py-4">
          <Field label="タイトル" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="予定名"
              className={inputClassFor(ro.title)}
              readOnly={ro.title}
              autoFocus={!ro.title}
            />
          </Field>

          <Field label="日付">
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className={inputClassFor(ro.date)}
              readOnly={ro.date}
              disabled={ro.date}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
            <Field label="開始" error={errors.time}>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startTime: e.target.value }))
                }
                className={inputClassFor(ro.startTime)}
                readOnly={ro.startTime}
                disabled={ro.startTime}
              />
            </Field>
            <Field label="終了">
              <input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endTime: e.target.value }))
                }
                className={inputClassFor(ro.endTime)}
                readOnly={ro.endTime}
                disabled={ro.endTime}
              />
            </Field>
          </div>

          <Field label="カラー">
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-label={opt.label}
                  aria-pressed={form.color === opt.value}
                  disabled={ro.color}
                  onClick={() =>
                    !ro.color && setForm((f) => ({ ...f, color: opt.value }))
                  }
                  className={[
                    'tap-strong h-8 w-8 rounded-full ring-offset-2',
                    opt.className,
                    form.color === opt.value
                      ? 'ring-2 ring-[var(--theme-main)]'
                      : 'ring-1 ring-black/10',
                    ro.color && 'opacity-60',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />
              ))}
            </div>
          </Field>

          <Field label="場所（任意）">
            <input
              type="text"
              value={form.location ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
              placeholder="会議室、オンラインなど"
              className={inputClassFor(ro.location)}
              readOnly={ro.location}
            />
          </Field>

          <Field label="メモ（任意）">
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="詳細メモ"
              rows={3}
              className={`${inputClassFor(ro.notes)} resize-none`}
              readOnly={ro.notes}
            />
          </Field>

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="tap w-full rounded-xl bg-[var(--theme-main-muted)] py-3 text-[17px] font-medium text-[var(--theme-main)]"
            >
              {secondaryAction.label}
            </button>
          )}

          {mode === 'edit' && event && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(event.id)
                onClose()
              }}
              className="tap w-full rounded-xl py-3 text-[17px] font-medium text-[#ff3b30] active:bg-[#ff3b3015]"
            >
              予定を削除
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// iOS Safari の input[type=date|time] は intrinsic min-width を持ち、
// grid/flex 子要素として 0 まで縮まないため、`min-w-0` を必ず付与する。
const inputClass =
  'block w-full min-w-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-calendar)] px-3 py-2.5 text-[17px] outline-none focus:border-[var(--theme-main)]'

const inputClassReadonly =
  'block w-full min-w-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2.5 text-[17px] text-[var(--theme-muted)] outline-none'

function inputClassFor(readOnly?: boolean) {
  return readOnly ? inputClassReadonly : inputClass
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    // grid/flex 配下で intrinsic min-width に押し負けないよう min-w-0 を付ける
    <label className="block min-w-0">
      <span className="mb-1 block text-[13px] font-medium text-[var(--theme-muted)]">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-[13px] text-[#ff3b30]">{error}</span>
      )}
    </label>
  )
}

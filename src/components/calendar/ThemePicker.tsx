import { colorThemes } from '../../themes/colorThemes'
import { useTheme } from '../../hooks/useTheme'
export default function ThemePicker() {
  const { themeId, setThemeId } = useTheme()

  return (
    <section
      className="border-b border-[var(--theme-border)] px-4 py-3"
      aria-label="カラーテーマ"
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-muted,#8e8e93)]">
        カラーテーマ
      </p>
      <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {colorThemes.map((preset) => (
          <li key={preset.id} className="shrink-0">
            <ThemeSwatch
              name={preset.name}
              main={preset.main}
              sub={preset.sub}
              calendar={preset.calendar}
              phone={preset.phone}
              selected={themeId === preset.id}
              onSelect={() => setThemeId(preset.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

type ThemeSwatchProps = {
  name: string
  main: string
  sub: string
  calendar: string
  phone: string
  selected: boolean
  onSelect: () => void
}

function ThemeSwatch({
  name,
  main,
  sub,
  calendar,
  phone,
  selected,
  onSelect,
}: ThemeSwatchProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${name}テーマ`}
      className={[
        'tap-strong flex flex-col items-center gap-1 rounded-xl px-2 py-1.5',
        selected ? 'bg-[var(--theme-main-muted)] ring-2 ring-[var(--theme-main)]' : 'active:bg-[var(--theme-surface)]',
      ].join(' ')}
    >
      <span className="relative h-9 w-9 overflow-hidden rounded-full shadow-sm ring-1 ring-black/10">
        <span
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${main} 50%, ${sub} 50%)`,
          }}
        />
        <span
          className="absolute bottom-0 left-0 right-0 h-2.5 opacity-90"
          style={{ backgroundColor: calendar }}
        />
        <span
          className="absolute inset-0 rounded-full ring-2 ring-inset ring-black/5"
          style={{ boxShadow: `inset 0 0 0 3px ${phone}` }}
        />
      </span>
      <span
        className={[
          'max-w-[52px] truncate text-[10px]',
          selected ? 'font-semibold text-[var(--theme-main)]' : 'text-[var(--theme-muted,#8e8e93)]',
        ].join(' ')}
      >
        {name}
      </span>
    </button>
  )
}

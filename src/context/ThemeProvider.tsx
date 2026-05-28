import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  colorThemes,
  defaultThemeId,
  getThemeById,
  type ColorTheme,
  type ColorThemeId,
} from '../themes/colorThemes'
import { ThemeContext } from './themeContext'

const STORAGE_KEY = 'calendar-color-theme'

function buildCssVars(theme: ColorTheme): Record<string, string> {
  return {
    '--theme-main': theme.main,
    '--theme-sub': theme.sub,
    '--theme-main-muted': `${theme.main}26`,
    '--theme-sub-muted': `${theme.sub}26`,
    '--theme-phone': theme.phone,
    '--theme-calendar': theme.calendar,
    '--theme-surface': theme.surface,
    '--theme-border': theme.border,
    '--theme-muted': '#8e8e93',
  }
}

function readStoredThemeId(): ColorThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && colorThemes.some((t) => t.id === stored)) {
      return stored as ColorThemeId
    }
  } catch {
    // ignore
  }
  return defaultThemeId
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ColorThemeId>(readStoredThemeId)

  const theme = useMemo(() => getThemeById(themeId), [themeId])
  const cssVars = useMemo(() => buildCssVars(theme), [theme])

  const setThemeId = useCallback((id: ColorThemeId) => {
    setThemeIdState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // ignore
    }
  }, [])

  const value = useMemo(
    () => ({ theme, themeId, setThemeId, cssVars }),
    [theme, themeId, setThemeId, cssVars],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

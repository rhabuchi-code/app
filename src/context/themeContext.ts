import { createContext } from 'react'
import type { ColorTheme, ColorThemeId } from '../themes/colorThemes'

export type ThemeContextValue = {
  theme: ColorTheme
  themeId: ColorThemeId
  setThemeId: (id: ColorThemeId) => void
  cssVars: Record<string, string>
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

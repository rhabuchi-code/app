import { describe, it, expect } from 'vitest'
import { colorThemes, defaultThemeId, getThemeById } from './colorThemes'

describe('colorThemes', () => {
  it('各テーマに必要なプロパティが揃っている', () => {
    for (const theme of colorThemes) {
      expect(theme.id).toBeTruthy()
      expect(theme.name).toBeTruthy()
      expect(theme.main).toMatch(/^#/)
      expect(theme.sub).toMatch(/^#/)
      expect(theme.phone).toMatch(/^#/)
      expect(theme.calendar).toMatch(/^#/)
      expect(theme.surface).toMatch(/^#/)
      expect(theme.border).toMatch(/^#/)
    }
  })

  it('idが重複していない', () => {
    const ids = colorThemes.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('デフォルトテーマが定義に存在する', () => {
    expect(colorThemes.some((t) => t.id === defaultThemeId)).toBe(true)
  })
})

describe('getThemeById', () => {
  it('指定したidのテーマを返す', () => {
    const theme = getThemeById('forest')
    expect(theme.id).toBe('forest')
    expect(theme.name).toBe('フォレスト')
  })

  it('該当がなければ先頭のテーマを返す（フォールバック）', () => {
    const theme = getThemeById('unknown' as unknown as 'ios')
    expect(theme).toEqual(colorThemes[0])
  })
})

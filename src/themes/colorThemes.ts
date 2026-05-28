export type ColorThemeId =
  | 'ios'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'ocean'
  | 'rose'

export type ColorTheme = {
  id: ColorThemeId
  name: string
  main: string
  sub: string
  /** スマホ画面全体のベース（シェル） */
  phone: string
  /** カレンダー部分（ヘッダー・月表示グリッド） */
  calendar: string
  /** 予定リスト・下部エリア */
  surface: string
  border: string
}

/** メイン＝選択・土曜・ボタン / サブ＝今日・日曜・タブアクティブ */
export const colorThemes: ColorTheme[] = [
  {
    id: 'ios',
    name: 'iOS',
    main: '#007aff',
    sub: '#ff3b30',
    phone: '#ffffff',
    calendar: '#ffffff',
    surface: '#f2f2f7',
    border: '#e5e5ea',
  },
  {
    id: 'forest',
    name: 'フォレスト',
    main: '#34c759',
    sub: '#30b0c7',
    phone: '#f4fbf5',
    calendar: '#f0faf2',
    surface: '#dff0e3',
    border: '#c8e6cf',
  },
  {
    id: 'sunset',
    name: 'サンセット',
    main: '#ff9500',
    sub: '#ff2d55',
    phone: '#fffaf5',
    calendar: '#fff5eb',
    surface: '#ffe8d6',
    border: '#ffd4b8',
  },
  {
    id: 'lavender',
    name: 'ラベンダー',
    main: '#5856d6',
    sub: '#af52de',
    phone: '#faf9ff',
    calendar: '#f5f4ff',
    surface: '#e8e6f8',
    border: '#d8d4f0',
  },
  {
    id: 'ocean',
    name: 'オーシャン',
    main: '#007aff',
    sub: '#5ac8fa',
    phone: '#f8fbff',
    calendar: '#f0f7ff',
    surface: '#dceeff',
    border: '#c5ddf5',
  },
  {
    id: 'rose',
    name: 'ローズ',
    main: '#ff2d55',
    sub: '#ff9500',
    phone: '#fffafb',
    calendar: '#fff0f3',
    surface: '#ffe0e8',
    border: '#ffc9d4',
  },
]

export const defaultThemeId: ColorThemeId = 'ios'

export function getThemeById(id: ColorThemeId): ColorTheme {
  return colorThemes.find((t) => t.id === id) ?? colorThemes[0]
}

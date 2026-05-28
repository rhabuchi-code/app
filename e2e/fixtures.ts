import { test as base, expect } from '@playwright/test'

/**
 * 各テストは Playwright がテストごとに新規 BrowserContext を作るため、
 * localStorage はクリーンな状態で開始される。
 * useEvents 側で localStorage が空のときは mockEvents にフォールバックするため、
 * 毎回モックイベント + iOSテーマでスタートする。
 *
 * ※ addInitScript で clear する方式はリロード時にも実行され、永続化を検証する
 *   テストを壊すため採用していない。
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/')
    await use(page)
  },
})

export { expect }

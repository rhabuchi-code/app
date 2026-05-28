import { test, expect } from './fixtures'

test.describe('カレンダー初期表示', () => {
  test('現在月のタイトルが表示される', async ({ page }) => {
    const now = new Date()
    const title = `${now.getFullYear()}年${now.getMonth() + 1}月`
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  })

  test('曜日ヘッダー（日〜土）が並んで表示される', async ({ page }) => {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    for (const w of weekdays) {
      await expect(page.getByText(w, { exact: true }).first()).toBeVisible()
    }
  })

  test('今日のモック予定が一覧に表示される', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /チームミーティング/ }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /ランチ/ })).toBeVisible()
  })

  test('カラーテーマピッカーが表示され、iOSがデフォルト選択', async ({
    page,
  }) => {
    await expect(page.getByLabel('カラーテーマ')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'iOSテーマ' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('下部タブ「カレンダー」がデフォルトでアクティブ', async ({ page }) => {
    const calendarTab = page.getByRole('button', { name: 'カレンダー' })
    await expect(calendarTab).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('月ナビゲーション', () => {
  test('「次の月」ボタンで翌月へ移動する', async ({ page }) => {
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextTitle = `${next.getFullYear()}年${next.getMonth() + 1}月`

    await page.getByRole('button', { name: '次の月' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(nextTitle)
  })

  test('「前の月」ボタンで前月へ移動する', async ({ page }) => {
    const now = new Date()
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevTitle = `${prev.getFullYear()}年${prev.getMonth() + 1}月`

    await page.getByRole('button', { name: '前の月' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(prevTitle)
  })

  test('「今日」ボタンで現在月に戻る', async ({ page }) => {
    const now = new Date()
    const currentTitle = `${now.getFullYear()}年${now.getMonth() + 1}月`

    await page.getByRole('button', { name: '次の月' }).click()
    await page.getByRole('button', { name: '次の月' }).click()
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(
      currentTitle,
    )

    await page
      .locator('header')
      .getByRole('button', { name: '今日' })
      .click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      currentTitle,
    )
  })
})

test.describe('下部タブ切り替え', () => {
  test('インボックスに切り替えると「今後の予定」が表示される', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'インボックス' }).click()
    await expect(
      page.getByRole('heading', { name: '今後の予定' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /デザインレビュー/ }),
    ).toBeVisible()
  })

  test('インボックスではカレンダーグリッドが非表示になる', async ({ page }) => {
    await page.getByRole('button', { name: 'インボックス' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
  })

  test('「今日」タブで現在日の予定一覧に切り替わる', async ({ page }) => {
    await page.getByRole('button', { name: 'インボックス' }).click()
    await page
      .getByRole('navigation')
      .getByRole('button', { name: '今日' })
      .click()
    await expect(
      page.getByRole('button', { name: /チームミーティング/ }),
    ).toBeVisible()
  })
})

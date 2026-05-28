import { test, expect } from './fixtures'

test.describe('カラーテーマ切り替え', () => {
  test('テーマを選択すると aria-pressed が切り替わる', async ({ page }) => {
    const iosBtn = page.getByRole('button', { name: 'iOSテーマ' })
    const forestBtn = page.getByRole('button', { name: 'フォレストテーマ' })

    await expect(iosBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(forestBtn).toHaveAttribute('aria-pressed', 'false')

    await forestBtn.click()

    await expect(forestBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(iosBtn).toHaveAttribute('aria-pressed', 'false')
  })

  test('テーマ選択は localStorage に保存される', async ({ page }) => {
    await page.getByRole('button', { name: 'サンセットテーマ' }).click()

    const storedId = await page.evaluate(() =>
      window.localStorage.getItem('calendar-color-theme'),
    )
    expect(storedId).toBe('sunset')
  })

  test('テーマ選択はリロード後も維持される', async ({ page }) => {
    await page.getByRole('button', { name: 'ラベンダーテーマ' }).click()
    await expect(
      page.getByRole('button', { name: 'ラベンダーテーマ' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await page.reload()

    await expect(
      page.getByRole('button', { name: 'ラベンダーテーマ' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('テーマ変更でカレンダー領域の背景色が変わる', async ({ page }) => {
    const calendarRegion = page.locator('section').filter({
      has: page.getByRole('heading', { level: 1 }),
    })

    const before = await calendarRegion.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    )

    await page.getByRole('button', { name: 'フォレストテーマ' }).click()

    await expect(async () => {
      const after = await calendarRegion.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      )
      expect(after).not.toBe(before)
    }).toPass()
  })
})

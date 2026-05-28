import { test, expect } from './fixtures'

test.describe('予定のCRUD', () => {
  test('新しい予定を追加すると一覧に表示される', async ({ page }) => {
    await page.getByRole('button', { name: '予定を追加' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: '予定を追加' }),
    ).toBeVisible()

    await dialog.getByPlaceholder('予定名').fill('E2Eテスト用ミーティング')
    await dialog.getByLabel('場所（任意）').fill('オンライン')
    await dialog.getByRole('button', { name: '保存' }).click()

    await expect(dialog).toBeHidden()
    await expect(
      page.getByRole('button', { name: /E2Eテスト用ミーティング/ }),
    ).toBeVisible()
  })

  test('タイトル未入力で保存するとバリデーションエラーが表示される', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '予定を追加' }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: '保存' }).click()

    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('タイトルを入力してください')).toBeVisible()
  })

  test('終了時刻が開始時刻より前だとエラーが表示される', async ({ page }) => {
    await page.getByRole('button', { name: '予定を追加' }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByPlaceholder('予定名').fill('時刻エラー')
    await dialog.getByLabel('開始').fill('15:00')
    await dialog.getByLabel('終了').fill('14:00')
    await dialog.getByRole('button', { name: '保存' }).click()

    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByText('終了時刻は開始時刻より後にしてください'),
    ).toBeVisible()
  })

  test('既存の予定を編集すると一覧が更新される', async ({ page }) => {
    await page
      .getByRole('button', { name: /チームミーティング/ })
      .click()

    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: '予定を編集' }),
    ).toBeVisible()

    const titleInput = dialog.getByPlaceholder('予定名')
    await expect(titleInput).toHaveValue('チームミーティング')
    await titleInput.fill('全社ミーティング')
    await dialog.getByRole('button', { name: '保存' }).click()

    await expect(dialog).toBeHidden()
    await expect(
      page.getByRole('button', { name: /全社ミーティング/ }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /^チームミーティング/ }),
    ).toHaveCount(0)
  })

  test('既存の予定を削除すると一覧から消える', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /ランチ/ }),
    ).toBeVisible()

    await page.getByRole('button', { name: /ランチ/ }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: '予定を削除' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: /ランチ/ })).toHaveCount(0)
  })

  test('「キャンセル」ボタンで入力を破棄してダイアログを閉じる', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '予定を追加' }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByPlaceholder('予定名').fill('破棄される予定')
    await dialog.getByRole('button', { name: 'キャンセル' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText('破棄される予定')).toHaveCount(0)
  })

  test('追加した予定はリロード後も残る（localStorage に永続化）', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '予定を追加' }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByPlaceholder('予定名').fill('永続化テスト予定')
    await dialog.getByRole('button', { name: '保存' }).click()
    await expect(dialog).toBeHidden()

    const stored = await page.evaluate(() =>
      window.localStorage.getItem('calendar-events'),
    )
    expect(stored).not.toBeNull()
    expect(stored).toContain('永続化テスト予定')

    await page.reload()
    await expect(
      page.getByRole('button', { name: /永続化テスト予定/ }),
    ).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.E2E_TEST_EMAIL
if (!TEST_EMAIL) {
  throw new Error('Set E2E_TEST_EMAIL to an existing account email before running this test.')
}

test('forgot-password sends a reset link without error', async ({ page }) => {
  page.on('console', (msg) => console.info(`[console.${msg.type()}]`, msg.text()))
  page.on('response', async (res) => {
    if (res.url().includes('supabase.co')) {
      console.info('[response]', res.status(), res.url())
      try { console.info('[response body]', await res.text()) } catch { /* ignore */ }
    }
  })
  page.on('requestfailed', (req) => {
    console.info('[requestfailed]', req.url(), req.failure()?.errorText)
  })

  await page.goto('/forgot-password')

  await page.getByPlaceholder('votre@email.com').fill(TEST_EMAIL)
  await page.getByRole('button', { name: 'Envoyer le lien' }).click()

  const success = page.getByText('Lien envoyé')
  const diagError = page.getByText('[DIAG]')

  await Promise.race([
    success.waitFor({ state: 'visible', timeout: 15_000 }),
    diagError.waitFor({ state: 'visible', timeout: 15_000 }),
  ])

  if (await diagError.isVisible()) {
    const message = await diagError.textContent()
    throw new Error(`resetPassword failed: ${message}`)
  }

  await expect(success).toBeVisible()
})

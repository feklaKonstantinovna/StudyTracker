import { test, expect } from '@playwright/test';

async function skipOnboard(page) {
  if (await page.locator('#onboardOverlay.show').isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Пропустить' }).click();
  }
}

test.describe('wave 0 core', () => {
  test('review card can close the day', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('sf_skip_onboard', '1'));
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await expect(page.getByTestId('review-card')).toBeVisible();
    await page.getByTestId('review-did').fill('Сделал конспект');
    await page.getByTestId('btn-close-day').click();
    await expect(page.getByTestId('review-did')).toHaveValue('Сделал конспект');
  });

  test('pages banner has no telegram and no login error path text', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('sf_skip_onboard', '1'));
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await expect(page.locator('body')).not.toContainText('от 15 000 ₽/школа');
    const banner = page.getByTestId('auth-banner');
    await expect(banner).not.toContainText(/Telegram/i);
  });

  test('empty day shows choose-template CTA after skip', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sf_skip_onboard', '1');
      localStorage.removeItem('sfv3');
    });
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await expect(page.getByTestId('empty-day-cta')).toBeVisible();
  });
});

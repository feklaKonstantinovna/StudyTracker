import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('mobile layout uses hamburger and does not clip main content', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sf_skip_onboard', '1'));
  await page.goto('/study-tracker_2.html');
  if (await page.locator('#onboardOverlay.show').isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Пропустить' }).click();
  }
  await expect(page.getByRole('button', { name: 'Меню' })).toBeVisible();
  const sidebarBox = await page.locator('.sidebar').boundingBox();
  const mainBox = await page.getByTestId('main-content').boundingBox();
  expect(mainBox?.x ?? 999).toBeLessThan(40);
  if (sidebarBox) {
    expect(sidebarBox.x + sidebarBox.width).toBeLessThan(40);
  }
  await page.getByRole('button', { name: 'Меню' }).click();
  await expect(page.locator('.sidebar')).toHaveClass(/open/);
});

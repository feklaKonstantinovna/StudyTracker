import { test, expect } from '@playwright/test';

async function skipOnboard(page) {
  const overlay = page.locator('#onboardOverlay');
  if (await overlay.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Пропустить' }).click();
  }
}

test.describe('index and main navigation', () => {
  test('index.html redirects into the tracker, not forcing login', async ({ page }) => {
    await page.goto('/index.html');
    await page.waitForURL(/study-tracker_2\.html/);
    await expect(page.getByTestId('tab-schedule')).toBeVisible();
  });

  test('schedule tab is the default home', async ({ page }) => {
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await expect(page.getByTestId('tab-schedule')).toBeVisible();
    await expect(page.getByTestId('tab-btn-schedule')).toBeVisible();
  });

  test('calendar tab renders a grid', async ({ page }) => {
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await page.getByTestId('tab-btn-calendar').click();
    await expect(page.getByTestId('tab-calendar')).toBeVisible();
    await expect(page.getByTestId('cal-grid')).toBeVisible();
    await expect(page.getByTestId('cal-month-label')).not.toBeEmpty();
  });

  test('analytics tab has period and csv', async ({ page }) => {
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await page.getByTestId('tab-btn-analytics').click();
    await expect(page.getByTestId('tab-analytics')).toBeVisible();
    await expect(page.getByTestId('analytics-period')).toBeVisible();
    await expect(page.getByTestId('btn-export-csv')).toBeVisible();
    await expect(page.getByTestId('btn-open-goals')).toBeVisible();
  });

  test('topics tab opens', async ({ page }) => {
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await page.getByTestId('tab-btn-topics').click();
    await expect(page.getByTestId('tab-topics')).toBeVisible();
  });

  test('monetize is not a primary nav item after boot', async ({ page }) => {
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await expect(page.getByTestId('tab-btn-monetize')).toHaveCount(0);
  });

  test('kanban lives under More until pinned', async ({ page }) => {
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    await page.getByRole('button', { name: /Ещё/ }).click();
    await page.getByRole('button', { name: /Канбан/ }).last().click();
    await expect(page.getByTestId('tab-kanban')).toBeVisible();
    await expect(page.getByTestId('kanban-board')).toBeVisible();
  });

  test('auth banner does not promise cloud on static host', async ({ page }) => {
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
    const banner = page.getByTestId('auth-banner');
    await expect(banner).toBeVisible();
    await expect(banner).not.toContainText(/синхронизировать прогресс между устройствами/i);
  });
});

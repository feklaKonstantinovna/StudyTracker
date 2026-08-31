import { test, expect } from '@playwright/test';

async function skipOnboard(page) {
  const overlay = page.locator('#onboardOverlay.show, .onboard-overlay.show');
  if (await overlay.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Пропустить' }).click();
  }
}

test.describe('schedule, blocks, templates', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sf_skip_onboard', '1');
    });
    await page.goto('/study-tracker_2.html');
    await skipOnboard(page);
  });

  test('date navigation and add-block control exist', async ({ page }) => {
    await expect(page.getByTestId('date-nav')).toBeVisible();
    await expect(page.getByTestId('btn-prev-day')).toBeVisible();
    await expect(page.getByTestId('btn-next-day')).toBeVisible();
    await expect(page.getByTestId('btn-add-block')).toBeVisible();
    await expect(page.getByTestId('btn-open-templates')).toBeVisible();
    await expect(page.getByTestId('btn-copy-tomorrow')).toBeVisible();
  });

  test('block modal opens, validates, saves a block', async ({ page }) => {
    await page.getByTestId('btn-add-block').click();
    await expect(page.getByTestId('modal-block')).toBeVisible();
    await page.getByTestId('block-modal-name').fill('SQL JOIN');
    await page.getByTestId('block-modal-subtitle').fill('Практика');
    await page.getByTestId('block-modal-time').fill('19:00');
    await page.getByTestId('block-modal-duration').fill('40');
    await page.getByTestId('block-modal-btn-save').click();
    await expect(page.getByTestId('schedule-blocks')).toContainText('SQL JOIN');
  });

  test('checking a block updates day progress', async ({ page }) => {
    await page.getByTestId('btn-add-block').click();
    await page.getByTestId('block-modal-name').fill('Блок прогресса');
    await page.getByTestId('block-modal-btn-save').click();
    const title = page.locator('[data-testid^="block-title-"]').filter({ hasText: 'Блок прогресса' });
    await expect(title).toBeVisible();
    const blockId = (await title.getAttribute('data-testid')).replace('block-title-', '');
    await page.getByTestId(`block-checkbox-${blockId}`).click();
    await expect(page.getByTestId('progress-pct')).toHaveText(/100%/);
  });

  test('task can be added inside an open block', async ({ page }) => {
    await page.getByTestId('btn-add-block').click();
    await page.getByTestId('block-modal-name').fill('С задачами');
    await page.getByTestId('block-modal-btn-save').click();
    const title = page.locator('[data-testid^="block-title-"]').filter({ hasText: 'С задачами' });
    const blockId = (await title.getAttribute('data-testid')).replace('block-title-', '');
    await page.getByTestId(`block-head-${blockId}`).click();
    await expect(page.locator(`#sblock-${blockId}`)).toHaveClass(/open/);
    await page.getByTestId(`btn-add-task-${blockId}`).click();
    await expect(page.getByTestId('modal-task')).toHaveClass(/show/);
    await page.getByTestId('task-modal-text').fill('Повторить Anki');
    await page.getByTestId('task-modal-anki').selectOption('1');
    await page.getByTestId('task-modal-btn-save').click();
    await expect(page.getByTestId(`task-list-${blockId}`)).toContainText('Повторить Anki');
  });

  test('templates modal lists builtin templates', async ({ page }) => {
    await page.getByTestId('btn-open-templates').click();
    await expect(page.getByTestId('modal-templates')).toBeVisible();
    await expect(page.getByTestId('template-list')).toContainText(/QA-день|Учёба/);
  });

  test('theme toggle flips body class', async ({ page }) => {
    const before = await page.locator('body').getAttribute('class');
    await page.getByTestId('btn-theme-toggle').click();
    const after = await page.locator('body').getAttribute('class');
    expect(after === before).toBeFalsy();
  });
});

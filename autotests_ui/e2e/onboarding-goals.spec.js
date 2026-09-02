import { test, expect } from '@playwright/test';

test.describe('onboarding and goals', () => {
  test('empty day shows 3-step onboarding', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('sf_skip_onboard');
      localStorage.removeItem('sfv3');
    });
    await page.goto('/study-tracker_2.html');
    await expect(page.locator('#onboardOverlay')).toBeVisible();
    await expect(page.locator('#onboardStep1')).toBeVisible();
    await page.locator('#onboardGoal').fill('Выучить SQL');
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.locator('#onboardStep2')).toBeVisible();
    await page.locator('input[name="onboardTpl"][value="tpl-qa"]').check();
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.locator('#onboardStep3')).toBeVisible();
    await page.getByRole('button', { name: 'Создать сегодня' }).click();
    await expect(page.locator('#onboardOverlay')).toBeHidden();
    await expect(page.getByTestId('schedule-blocks')).not.toBeEmpty();
  });

  test('goals modal can create a learning goal', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('sf_skip_onboard', '1'));
    await page.goto('/study-tracker_2.html');
    if (await page.locator('#onboardOverlay.show').isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Пропустить' }).click();
    }
    await page.getByTestId('tab-btn-analytics').click();
    await page.getByTestId('btn-open-goals').click();
    await expect(page.getByTestId('modal-goals')).toBeVisible();
    await page.getByTestId('btn-add-goal').click();
    await expect(page.getByTestId('modal-goal-edit')).toBeVisible();
    await page.getByTestId('goal-edit-title').fill('40 часов SQL');
    await page.getByTestId('goal-edit-hours').fill('40');
    await page.getByTestId('goal-edit-btn-save').click();
    await expect(page.getByTestId('goals-list')).toContainText('40 часов SQL');
  });

  test('SQL JOIN goal preselects SQL-day template', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('sf_skip_onboard');
      localStorage.removeItem('sfv3');
    });
    await page.goto('/study-tracker_2.html');
    await page.locator('#onboardGoal').fill('SQL JOIN');
    await page.getByRole('button', { name: 'Дальше' }).click();
    await expect(page.locator('input[name="onboardTpl"][value="tpl-sql"]')).toBeChecked();
    await page.getByRole('button', { name: 'Дальше' }).click();
    await page.getByRole('button', { name: 'Создать сегодня' }).click();
    await expect(page.locator('#onboardOverlay')).toBeHidden();
    await expect(page.getByTestId('schedule-blocks')).toContainText(/JOIN|Три запроса/);
  });

  test('template modal lists IT evening templates and weekend Anki', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('sf_skip_onboard', '1'));
    await page.goto('/study-tracker_2.html');
    if (await page.locator('#onboardOverlay.show').isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Пропустить' }).click();
    }
    await page.getByTestId('btn-open-templates').click();
    const list = page.getByTestId('template-list');
    await expect(list).toContainText('SQL-день');
    await expect(list).toContainText('Frontend-день');
    await expect(list).toContainText('Backend-день');
    await expect(list).toContainText('QA после работы');
    await expect(list).toContainText('Выходной — только Anki');
    await expect(list).toContainText('Мягкий вход после срыва');
  });
});

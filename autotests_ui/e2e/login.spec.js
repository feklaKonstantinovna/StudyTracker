import { test, expect } from '@playwright/test';

test.describe('login.html', () => {
  test('shows form fields and submit', async ({ page }) => {
    await page.goto('/login.html');
    await expect(page.getByTestId('login-card')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('shows test credentials on loopback even without qa flag', async ({ page }) => {
    await page.goto('/login.html');
    await expect(page.getByTestId('login-hint')).toBeVisible();
  });

  test('shows test credentials with ?qa=1', async ({ page }) => {
    await page.goto('/login.html?qa=1');
    await expect(page.getByTestId('login-hint')).toBeVisible();
    await expect(page.getByTestId('login-hint')).toContainText('test@studyflow.app');
  });

  test('validates empty email', async ({ page }) => {
    await page.goto('/login.html');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('login-error')).toContainText(/email/i);
  });

  test('validates short password', async ({ page }) => {
    await page.goto('/login.html');
    await page.getByTestId('login-email').fill('user@example.com');
    await page.getByTestId('login-password').fill('123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('login-error')).toContainText(/6/);
  });

  test('logs in with mock user and redirects to tracker', async ({ page }) => {
    await page.goto('/login.html?qa=1');
    await page.getByTestId('login-email').fill('test@studyflow.app');
    await page.getByTestId('login-password').fill('Test1234');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-success')).toBeVisible();
    await page.waitForURL(/study-tracker_2\.html/, { timeout: 8000 });
  });

  test('link to app points at tracker', async ({ page }) => {
    await page.goto('/login.html');
    await expect(page.getByTestId('link-to-app')).toHaveAttribute('href', /study-tracker_2\.html/);
  });
});

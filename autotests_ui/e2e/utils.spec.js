import { test, expect } from '@playwright/test';

test('date and sanitize helpers behave as specified', async ({ page }) => {
  await page.goto('/study-tracker_2.html');
  const result = await page.evaluate(async () => {
    const { dk, pad, fmtT, isWE } = await import('/src/utils/dateUtils.js');
    const { escapeHtml } = await import('/src/utils/sanitize.js');
    const d = new Date(2026, 0, 1, 0, 30, 0);
    const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      pad: pad(3),
      fmt: fmtT(65),
      html: escapeHtml('<x>'),
      amp: escapeHtml('a&b'),
      empty: escapeHtml(null),
      dk: dk(d),
      local,
      sat: isWE(new Date(2026, 7, 29)),
      mon: isWE(new Date(2026, 7, 31)),
    };
  });
  expect(result.pad).toBe('03');
  expect(result.fmt).toBe('01:05');
  expect(result.html).toBe('&lt;x&gt;');
  expect(result.amp).toBe('a&amp;b');
  expect(result.empty).toBe('');
  expect(result.sat).toBe(true);
  expect(result.mon).toBe(false);
  expect(result.dk).toBe(result.local);
});

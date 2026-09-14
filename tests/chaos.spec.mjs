import { test, expect } from '@playwright/test';

const pages = ['/', '/tank/', '/journal/'];

test('core navigation works when script load fails', async ({ page }) => {
  await page.route('**/script.js', (route) => route.abort());
  await page.goto('/');

  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('link', { name: 'The Tank' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Journal' }).first()).toBeVisible();
});

test('content remains readable when stylesheet load fails', async ({ page }) => {
  await page.route('**/style.css', (route) => route.abort());
  await page.goto('/journal/');

  await expect(page.getByRole('heading', { name: 'Journal' })).toBeVisible();
  await expect(page.locator('.entry')).toHaveCount(3);
});

test('slow network plus font failure still renders key content', async ({ page }) => {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
      await route.abort();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 120));
    await route.continue();
  });

  await page.goto('/tank/');

  await expect(page.getByRole('heading', { name: 'The Tank' })).toBeVisible();
  await expect(page.getByText('Stocking plan')).toBeVisible();
});

test('reduced-motion preference keeps journal entries visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/journal/');

  const firstEntry = page.locator('.entry').first();
  await expect(firstEntry).toBeVisible();
  await expect(firstEntry).toHaveCSS('opacity', '1');
});

test('without IntersectionObserver journal content still appears', async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-ignore
    window.IntersectionObserver = undefined;
  });

  await page.goto('/journal/');
  await expect(page.locator('.entry').nth(1)).toBeVisible();
});

test('404 path degrades predictably', async ({ page }) => {
  const response = await page.goto('/does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByText('Not Found')).toBeVisible();
});

test('all pages retain key landmarks', async ({ page }) => {
  for (const pathname of pages) {
    await page.goto(pathname);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  }
});

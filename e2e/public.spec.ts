import { test, expect } from '@playwright/test';

test('home renders hero, both original logos and no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('healthier tomorrow');
  await expect(page.getByAltText('RADAR Centre emblem').first()).toBeVisible();
  await expect(page.getByAltText('Rajalakshmi Institute of Technology').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test('primary public routes load', async ({ page }) => {
  for (const path of ['/about', '/research', '/members', '/events', '/projects', '/contact']) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
  }
});

test('detail routes load and unpublished project stays hidden', async ({ page }) => {
  await page.goto('/members/s-praveena');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Praveena');
  await page.goto('/projects/smart-posture-detection');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Smart Posture Detection');
  const response = await page.goto('/projects/medical-scan-risk-assessment');
  expect(response?.status()).toBe(404);
});

test('events explorer filters and preserves undated activities', async ({ page }) => {
  await page.goto('/events');
  await expect(page.getByText('Date not recorded').first()).toBeVisible();
  await page.getByRole('tab', { name: 'Outreach' }).click();
  await expect(page.getByRole('heading', { name: /Outreach Programme at JVVM/ })).toBeVisible();
  await page.getByLabel('Search events').fill('IIT Madras');
  await expect(page.getByText('No matching events')).toBeVisible();
});

test('mobile layout has working menu and no overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
  await page.getByRole('navigation', { name: 'Mobile' }).getByRole('link', { name: 'Research' }).click();
  await expect(page).toHaveURL(/\/research$/);
});

test('admin requires authentication', async ({ page }) => {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.locator('input[type="password"], input[name="passcode"]').first()).toBeVisible();
});

test('contact form validates and preview mode never fakes delivery', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.locator('.field-error').first()).toBeVisible();
  await page.getByLabel('Name', { exact: true }).fill('Test Visitor');
  await page.getByLabel('Email', { exact: true }).fill('visitor@example.org');
  await page.getByLabel('Subject', { exact: true }).fill('Collaboration enquiry');
  await page.getByLabel('Message', { exact: true }).fill('We would like to discuss a research collaboration with RADAR.');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.locator('.form-error')).toContainText('read-only preview');
  await expect(page.locator('.form-success')).toHaveCount(0);
});

test('admin sign-in in preview reports the limitation honestly', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Administrator passcode').fill('test-passcode');
  await page.getByRole('button', { name: /Enter workspace/ }).click();
  await expect(page.locator('#admin-login-error')).toContainText('read-only preview');
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('admin APIs refuse writes while unconfigured', async ({ request }) => {
  const write = await request.post('/api/admin/content/members', { data: { record: {}, intent: 'draft' } });
  expect(write.status()).toBe(503);
  const dashboard = await request.get('/api/admin/dashboard');
  expect(dashboard.status()).toBe(503);
  const body = await dashboard.json();
  expect(body.error).toBeTruthy();
});

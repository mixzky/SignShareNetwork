import { test, expect } from '@playwright/test';

test.describe('Admin Insights Dashboard', () => {
  const email = 'admin@example.com';
  const password = '123456';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder('Email').fill(email);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('shows metrics and charts for admin user', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/insights');

    // Loading status
    await expect(page.getByRole('status')).toBeVisible();

    // Wait for dashboard elements to appear
    await expect(page.getByText(/Daily Uploads/i)).toBeVisible();
    await expect(page.getByText(/Active Users/i)).toBeVisible();
    await expect(page.getByText(/Approval Rate/i)).toBeVisible();

    // Check at least one metric value
    await expect(page.getByText(/\d+/)).toBeVisible(); // Any number
  });

  test('blocks access for non-admin user', async ({ page }) => {
    // Log in as a non-admin user
    await page.goto('http://localhost:3000/logout');
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder('Email').fill('user@example.com');
    await page.getByPlaceholder('Password').fill('123456');
    await page.getByRole('button', { name: /login/i }).click();

    await page.goto('http://localhost:3000/admin/insights');
    await expect(page.getByText(/Access Denied/i)).toBeVisible();
  });

  test('shows empty state when no uploads exist', async ({ page }) => {
    // You should prepare your test DB to have no sign_videos in last 7 days

    await page.goto('http://localhost:3000/admin/insights');
    await expect(page.getByText(/No uploads in the last 7 days/i)).toBeVisible();
    await expect(page.getByText(/No submissions yet/i)).toBeVisible();
  });
});

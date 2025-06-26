import { test, expect } from '@playwright/test';

test.describe('Admin Insights Dashboard', () => {
  const email = 'admin@gmail.com';
  const password = '12345678';

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login', { timeout: 1000000 });
    await page.getByPlaceholder('Email').fill(email, { timeout: 10000000 });
    await page.getByPlaceholder('Password').fill(password, { timeout: 1000000 });
    await page.getByRole('button', { name: /login/i }).click({ timeout: 1000000 });
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });
  });

  test('shows admin dashboard', async ({ page }) => {
     await page.goto('http://localhost:3000/admin', { timeout: 10000 });

    // Dashboard section
    await page.getByRole('link', { name: 'Dashboard' }).click({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Video Verification/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible({ timeout: 10000 });

    // Videos section
    await page.getByRole('link', { name: 'Videos' }).click({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'sign language', exact: true })).toBeVisible({ timeout: 10000 });

    // Users section
    await page.getByRole('link', { name: 'Users' }).click({ timeout: 10000 });
    await expect(page.getByText(/admin@gmail\.com/)).toBeVisible({ timeout: 10000 });

    // Insights section
    await page.getByRole('link', { name: 'Insights' }).click({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Daily Uploads/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Active Users/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Approval Rate/i })).toBeVisible({ timeout: 10000 });
  });

  test('blocks access for non-admin user', async ({ page }) => {
    // Log in as a non-admin user
    await page.goto('http://localhost:3000/', { timeout: 10000 });
    await page.getByRole('button', { name: 'A admin@gmail.com' }).click({ timeout: 10000 });
    await page.getByRole('menuitem', { name: 'Sign Out' }).click({ timeout: 10000 });
    await page.getByRole('link', { name: 'Login' }).click({ timeout: 10000 });
    await page.getByPlaceholder('Email').fill('pisitpat1412@gmail.com', { timeout: 10000 });
    await page.getByPlaceholder('Password').fill('12345678', { timeout: 10000 });
    await page.getByRole('button', { name: /login/i }).click({ timeout: 10000 });
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });
    await page.goto('http://localhost:3000/admin', { timeout: 10000 });
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 10000 });
  });
});


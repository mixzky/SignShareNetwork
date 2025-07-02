import { test, expect, type Page } from '@playwright/test';

test.describe('Admin Panel Features', () => {
  // Increase test timeout since we're dealing with auth
  test.setTimeout(60000);

  // Helper function to ensure stable login
  async function loginAs(page: Page, email: string, password: string) {
    await page.goto('http://localhost:3000');
    
    // Wait for Supabase to initialize
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: 'Login' }).click();
    await page.waitForLoadState('networkidle');
    
    // Use more specific selectors for email and password
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'login' }).click();
    
    // Wait for login to complete and session to be set
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Increased timeout for session setup
  }

  test.describe('Access Control', () => {
    test('admin can access admin panel', async ({ page }) => {
      await loginAs(page, 'admin@gmail.com', '12345678');

      // Access admin dashboard with proper waiting
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for client-side navigation

      // Wait for admin panel with increased timeout
      await expect(page.getByText('Admin Panel')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('navigation')).toBeVisible();

      // Verify admin navigation items
      await expect(page.getByRole('link', { name: 'Insights' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Videos' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Flags' })).toBeVisible();
    });

    test('moderator has limited access', async ({ page }) => {
      await loginAs(page, 'moderator@gmail.com', '12345678b!B');

      // Access admin dashboard with proper waiting
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for client-side navigation

      // Wait for admin panel with increased timeout
      await expect(page.getByText('Admin Panel')).toBeVisible({ timeout: 15000 });

      // Verify moderator navigation items (limited access)
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Videos' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Flags' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Insights' })).not.toBeVisible();
    });

    test('regular user cannot access admin features', async ({ page }) => {
      await loginAs(page, 'pisitpat1412@gmail.com', '12345678');
      
      // Try to access admin pages with proper waiting
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for client-side navigation
      
      // Should be redirected to home
      await expect(page).toHaveURL('http://localhost:3000/');
    });
  });

  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin@gmail.com', '12345678');
      
      // Navigate to users page and wait for load
      await page.goto('http://localhost:3000/admin/users');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
    });

    test('admin user management and search', async ({ page }) => {
      // User management section
      await page.getByRole('link', { name: 'Users' }).click();
      await page.waitForLoadState('networkidle');
    
      // Search functionality
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).click();
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).fill('testuser_518903@example.com');
      await page.getByText('testuser_518903@example.com').click();
      await page.getByRole('heading', { name: 'testuser_518903' }).click();
    
      // Moderator management
      await page.getByRole('button', { name: 'Make Mod' }).click();
      await page.waitForLoadState('networkidle');
    
      await page.getByRole('button', { name: 'Moderators' }).click();
      await page.waitForLoadState('networkidle');
    
      await page.getByRole('heading', { name: 'testuser_518903' }).click();
      await page.getByText('testuser_518903@example.com').click();
    
      // Switch between user filters
      await page.getByRole('button', { name: 'Users', exact: true }).click();
      await page.waitForLoadState('networkidle');
    
      await page.getByRole('button', { name: 'Moderators' }).click();
      await page.waitForLoadState('networkidle');
    
      // Remove moderator role
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).click();
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).fill('testuser_518903@example.com');
      await page.getByText('testuser_518903@example.com').click();
      await page.getByRole('heading', { name: 'testuser_518903' }).click();
      await page.getByRole('button', { name: 'Remove Mod' }).click();
      await page.waitForLoadState('networkidle');
    });
    
    test('banned user login attempt', async ({ page }) => {
      // Search for and ban the test user
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).click();
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).fill('khannpwks173@gmail.com');
      await page.getByText('khannpwks173@gmail.com').click();
      await page.getByRole('heading', { name: 'mix' }).click();
      await page.getByRole('button', { name: 'Ban' }).click();
      await expect(page.getByText('User has been banned')).toBeVisible();
      await page.waitForLoadState('networkidle');
  
      // Sign out admin
      const signOutButton = page.getByRole('button', { name: /sign out/i });
      await signOutButton.waitFor({ state: 'visible' });
      await signOutButton.click();
      await page.waitForLoadState('networkidle');

      // Try to login as banned user
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');

      const emailInput = page.getByRole('textbox', { name: 'Email' });
      const passwordInput = page.getByRole('textbox', { name: 'Password' });
      const loginButton = page.getByRole('button', { name: 'login' });

      await emailInput.waitFor({ state: 'visible' });
      await emailInput.fill('khannpwks173@gmail.com');
      
      await passwordInput.waitFor({ state: 'visible' });
      await passwordInput.fill('123456');
      
      await loginButton.waitFor({ state: 'visible' });
      await loginButton.click();

      // Verify banned user cannot login
      await expect(page.getByText(/account has been banned/i)).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL('http://localhost:3000/login');

      // Login as admin to unban
      await loginAs(page, 'admin@gmail.com', '12345678');
      
      // Navigate to users page and unban
      await page.goto('http://localhost:3000/admin/users');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');

      const searchInputAgain = page.getByPlaceholder(/search users/i);
      await searchInputAgain.waitFor({ state: 'visible', timeout: 15000 });
      await searchInputAgain.fill('khannpwks173@gmail.com');
      await page.keyboard.press('Enter');
      
      const bannedUserRow = page.getByRole('row').filter({ hasText: 'khannpwks173@gmail.com' });
      await bannedUserRow.waitFor({ timeout: 10000 });
      
      const unbanButton = bannedUserRow.getByRole('button', { name: /unban/i });
      await unbanButton.waitFor({ state: 'visible' });
      await unbanButton.click();
      
      const confirmUnbanButton = page.getByRole('button', { name: /confirm/i });
      await confirmUnbanButton.waitFor({ state: 'visible' });
      await confirmUnbanButton.click();
      
      await expect(bannedUserRow.getByText(/active/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Video Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin@gmail.com', '12345678');
      
      // Navigate to videos page and wait for load
      await page.goto('http://localhost:3000/admin/videos');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
    });

    test('search and approve video', async ({ page }) => {
      // Wait for and interact with search input
      const searchInput = page.getByPlaceholder(/search videos/i);
      await searchInput.waitFor({ state: 'visible', timeout: 15000 });
      await searchInput.fill('test video');
      await page.keyboard.press('Enter');
      
      // Find and verify video
      const videoRow = page.getByRole('row').filter({ hasText: 'test video' });
      await videoRow.waitFor({ timeout: 10000 });
      
      // Approve video
      const approveButton = videoRow.getByRole('button', { name: /approve/i });
      await approveButton.waitFor({ state: 'visible' });
      await approveButton.click();
      
      // Verify approval
      await expect(page.getByText(/video approved/i)).toBeVisible({ timeout: 10000 });
    });

    test('video status filters', async ({ page }) => {
      const statuses = ['pending', 'verified', 'flagged', 'processing', 'rejected'];
      
      for (const status of statuses) {
        // Click status filter with explicit wait
        const filterButton = page.getByRole('button', { name: new RegExp(status, 'i') });
        await filterButton.waitFor({ state: 'visible', timeout: 10000 });
        await filterButton.click();
        
        // Wait for filter to apply
        await page.waitForLoadState('networkidle');
        
        // Verify filtered results
        await expect(page.getByText(new RegExp(`${status} videos`, 'i'))).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Flag Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin before each flag management test
      await page.getByRole('link', { name: 'Login' }).click();
      await page.getByText('Email').click();
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@gmail.com');
      await page.getByRole('textbox', { name: 'Password' }).click();
      await page.getByRole('textbox', { name: 'Password' }).fill('12345678');
      await page.getByRole('button', { name: 'login' }).click();
      await page.goto('http://localhost:3000/admin/flags');
    });

    test('resolve flag', async ({ page }) => {
      // Find a pending flag
      const flagCard = page.locator('.bg-white').filter({ hasText: /pending/i }).first();
      await expect(flagCard).toBeVisible();

      // Click resolve button
      await flagCard.getByRole('button', { name: 'Resolve flag' }).click();
      await expect(page.getByText(/flag resolved/i)).toBeVisible();
    });

    test('dismiss flag', async ({ page }) => {
      // Find a pending flag
      const flagCard = page.locator('.bg-white').filter({ hasText: /pending/i }).first();
      await expect(flagCard).toBeVisible();

      // Click dismiss button
      await flagCard.getByRole('button', { name: 'Dismiss flag' }).click();
      await expect(page.getByText(/flag dismissed/i)).toBeVisible();
    });

    test('flag status filters', async ({ page }) => {
      // Test each status filter
      const statuses = ['pending', 'resolved', 'dismissed'];
      
      for (const status of statuses) {
        await page.getByRole('button', { name: new RegExp(status, 'i') }).click();
        await expect(page.getByText(new RegExp(`${status} flags`, 'i'))).toBeVisible();
      }
    });
  });

  test.describe('Analytics and Insights', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin before each analytics test
      await page.getByRole('link', { name: 'Login' }).click();
      await page.getByText('Email').click();
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@gmail.com');
      await page.getByRole('textbox', { name: 'Password' }).click();
      await page.getByRole('textbox', { name: 'Password' }).fill('12345678');
      await page.getByRole('button', { name: 'login' }).click();
      await page.goto('http://localhost:3000/admin/insights');
    });

    test('view analytics dashboard', async ({ page }) => {
      // Verify page header
      await expect(page.getByRole('heading', { name: 'Admin Insights' })).toBeVisible();
      await expect(page.getByText('Platform analytics and performance metrics')).toBeVisible();

      // Verify statistics cards
      await expect(page.locator('.grid').first()).toBeVisible();

      // Verify charts
      await expect(page.locator('canvas').first()).toBeVisible(); // Daily uploads chart
      await expect(page.locator('canvas').nth(1)).toBeVisible(); // Active users chart
      await expect(page.locator('canvas').nth(2)).toBeVisible(); // Approval rate chart
    });

    test('export analytics data', async ({ page }) => {
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('button', { name: /export data/i }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/analytics.*\.csv$/);
    });
  });
});


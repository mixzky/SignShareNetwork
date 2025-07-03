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
      await page.waitForTimeout(2000);
    
      // Moderator management
      await page.getByRole('button', { name: 'Make Mod' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Moderators' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.getByRole('heading', { name: 'testuser_518903' }).click();
      await page.waitForTimeout(1000);
      await page.getByText('testuser_518903@example.com').click();
    
      // Switch between user filters
      await page.getByRole('button', { name: 'Users', exact: true }).click();
      await page.waitForLoadState('networkidle');
    
      await page.getByRole('button', { name: 'Moderators' }).click();
      await page.waitForLoadState('networkidle');
    
      // Remove moderator role
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).fill('testuser_518903@example.com');
      await page.waitForTimeout(1000);
      await page.getByText('testuser_518903@example.com').click();
      await page.waitForTimeout(1000);
      await page.getByRole('heading', { name: 'testuser_518903' }).click();
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: 'Remove Mod' }).click();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
    });
    
    test('banned user login attempt', async ({ page }) => {
      // Search for and ban the test user
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).click();
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).fill('khannpwks173@gmail.com');
      await page.waitForLoadState('networkidle');

      // Find the specific user's card and ban button
      const userCard = page.locator('.bg-white').filter({ hasText: 'khannpwks173@gmail.com' }).first();
      await userCard.waitFor({ state: 'visible', timeout: 10000 });
      
      const banButton = userCard.getByRole('button', { name: 'Ban' });
      await banButton.waitFor({ state: 'visible' });
      await banButton.click();
      
      await expect(page.getByText('User has been banned')).toBeVisible();
      await page.waitForLoadState('networkidle');

      // Sign out admin
      await page.goto('http://localhost:3000');
      await page.getByRole('button', { name: 'A admin' }).click();
      await page.getByRole('menuitem', { name: 'Sign Out' }).click();
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
      
      await passwordInput.waitFor({ state: 'visible' })
      await passwordInput.fill('123456');
      
      await loginButton.waitFor({ state: 'visible' });
      await loginButton.click();

      // Verify banned user cannot login
      await page.getByRole('paragraph').filter({ hasText: 'Your account has been' }).isVisible();
      await expect(page).toHaveURL('http://localhost:3000/login');

      // Login as admin to unban
      await loginAs(page, 'admin@gmail.com', '12345678');
      
      // Navigate to users page and unban
      await page.goto('http://localhost:3000/admin/users');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');

      // Search for and ban the test user
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).click();
      await page.getByRole('textbox', { name: 'Search by name, email, or' }).fill('khannpwks173@gmail.com');
      await page.waitForLoadState('networkidle');

      // Find the specific user's card and ban button
      const userCard1 = page.locator('.bg-white').filter({ hasText: 'khannpwks173@gmail.com' }).first();
      await userCard.waitFor({ state: 'visible', timeout: 10000 });
      
      const banButton1 = userCard1.getByRole('button', { name: 'Ban' });
      await banButton1.waitFor({ state: 'visible' });
      await banButton1.click();
      
      await expect(page.getByText('User has been unbanned')).toBeVisible();
      await page.waitForLoadState('networkidle');
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
    
    test('video search and filter workflow', async ({ page }) => {
      // Test different status filters
      const filterButton = page.getByRole('button', { name: 'Processing' });
      await filterButton.waitFor({ state: 'visible', timeout: 10000 });
      await filterButton.click();
      await page.waitForLoadState('networkidle');

      // Check flagged videos
      await page.getByRole('button', { name: 'Flagged' }).click();
      await page.waitForLoadState('networkidle');
      
      // Verify empty state for flagged videos
      await expect(page.getByText('No Videos Found')).toBeVisible();

      // Check rejected videos
      await page.getByRole('button', { name: 'Rejected' }).click();
      await page.waitForLoadState('networkidle');

      // Return to all videos
      await page.getByRole('button', { name: 'All Videos' }).click();
      await page.waitForLoadState('networkidle');

      // Search functionality test
      const searchInput = page.getByRole('textbox', { name: 'Search by title, description' });
      await searchInput.waitFor({ state: 'visible', timeout: 10000 });

      // Search for 'monkey'
      await searchInput.click();
      await searchInput.fill('monkey');
      await page.waitForLoadState('networkidle');
      
      // Verify search results are displayed - using a more specific selector
      const firstVideoCard = page.locator('.text-card-foreground').first();
      await expect(firstVideoCard).toBeVisible({ timeout: 10000 });

      // Additional verification that we're looking at video cards
      const videoCards = page.locator('.text-card-foreground');
      const count = await videoCards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Flag Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin@gmail.com', '12345678');

      await page.goto('http://localhost:3000/admin/flags');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
    });

    test('flag status navigation and content verification', async ({ page }) => {
      // Check pending flags
      const pendingButton = page.getByRole('button', { name: 'Pending' });
      await pendingButton.waitFor({ state: 'visible', timeout: 10000 });
      await pendingButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verify no pending flags message using specific heading selector
      await expect(page.getByRole('heading', { name: 'No pending Flags' })).toBeVisible();

      // Check resolved flags
      await page.getByRole('button', { name: 'Resolved' }).click();
      await page.waitForLoadState('networkidle');
      
      // Verify resolved flags section
      await expect(page.getByRole('heading', { name: 'Resolved Flags' })).toBeVisible();
      
      // Verify at least one resolved flag exists
      const resolvedFlags = page.locator('.bg-white').filter({ hasText: /Resolved/ });
      await expect(resolvedFlags.first()).toBeVisible();

      // Check dismissed flags
      await page.getByRole('button', { name: 'Dismissed' }).click();
      await page.waitForLoadState('networkidle');
      
      // Verify no dismissed flags message using specific heading selector
      await expect(page.getByRole('heading', { name: /No dismissed Flags/i })).toBeVisible();
      
      // Verify empty state is shown (using a more general selector)
      const emptyState = page.locator('h3, p').filter({ hasText: /No dismissed|dismissed flags/i });
      await expect(emptyState.first()).toBeVisible();
    });
  });

  test.describe('Analytics and Insights', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, 'admin@gmail.com', '12345678');

      await page.goto('http://localhost:3000/admin/insights');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
    });

    test('view analytics dashboard', async ({ page }) => {
      // Verify page header
      await expect(page.getByRole('heading', { name: 'Admin Insights' })).toBeVisible();
      await expect(page.getByText('Platform analytics and performance metrics')).toBeVisible();

      // Wait for the metrics grid to be visible with increased timeout
      const metricsGrid = page.locator('.grid').first();
      await expect(metricsGrid).toBeVisible({ timeout: 15000 });

      // Verify each metric card exists and has a value
      const metricTexts = [
        /Total Videos/i,
        /Active Users/i,  // More flexible match without the "(7d)"
        /Approval Rate/i
      ];

      // Wait a bit for all cards to load
      await page.waitForTimeout(2000);

      for (const textPattern of metricTexts) {
        // Find any card containing the metric text
        const card = page.locator('.text-card-foreground')
          .filter({ hasText: textPattern })
          .first();
        
        await expect(card).toBeVisible({ timeout: 15000 });
        
        // Verify the card has a numeric value
        const hasValue = await card.evaluate(el => {
          const text = el.textContent || '';
          return /\d/.test(text); // Check if there's at least one digit
        });
        expect(hasValue).toBeTruthy();
      }

      // Wait for charts to load
      await page.waitForTimeout(2000);

      // Verify chart sections exist
      const chartTitles = [
        /Daily Uploads/i,  // More flexible match
        /Video Status/i
      ];

      for (const titlePattern of chartTitles) {
        const section = page.locator('div')
          .filter({ hasText: titlePattern })
          .first();
        await expect(section).toBeVisible({ timeout: 15000 });
      }

      // Verify video status chart has data
      const videoStatusSection = page.locator('div')
        .filter({ hasText: /Video Status/i })
        .first();
      await expect(videoStatusSection).toBeVisible();

      // Verify both charts are visible
      // Daily uploads chart
      const dailyUploadsSection = page.locator('div')
        .filter({ hasText: /Daily Uploads/i })
        .first();
      await expect(dailyUploadsSection.locator('canvas').first()).toBeVisible();

      // Video status chart (pie chart)
      const videoCanvas = videoStatusSection.locator('canvas').first();
      await expect(videoCanvas).toBeVisible();

      // Verify the status chart has some status labels
      const statusText = await videoStatusSection.textContent();
      expect(statusText).toMatch(/Verified|Other/); // Check for status labels without specific numbers

      // Verify navigation menu is present
      await expect(page.getByText(/Admin Panel.*Dashboard.*Videos.*Users.*Flags/)).toBeVisible();
    });
  });
});


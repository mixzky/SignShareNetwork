import { test, expect } from '@playwright/test';

test.describe('Admin Features', () => {
  // Setup: Login as admin before each test
  test.beforeEach(async ({ page }) => {
    // Login with admin credentials
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Email").fill("admin@example.com");
    await page.getByPlaceholder("Password").fill("adminpass123");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test.describe('Admin Access Control', () => {
    test("admin can access admin dashboard", async ({ page }) => {
      await page.goto("http://localhost:3000/admin");
      await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();
      await expect(page.getByRole("navigation", { name: /admin navigation/i })).toBeVisible();
    });

    test("non-admin cannot access admin dashboard", async ({ page }) => {
      // Logout first
      await page.getByRole("button", { name: /sign out/i }).click();
      
      // Login as regular user
      await page.goto("http://localhost:3000/login");
      await page.getByPlaceholder("Email").fill("user@example.com");
      await page.getByPlaceholder("Password").fill("userpass123");
      await page.getByRole("button", { name: /login/i }).click();
      
      // Try to access admin page
      await page.goto("http://localhost:3000/admin");
      await expect(page).toHaveURL("http://localhost:3000/");
      await expect(page.getByText(/access denied/i)).toBeVisible();
    });
  });

  test.describe('User Management', () => {
    test("view user list", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/users");
      
      // Verify user list elements
      await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
      await expect(page.getByRole("grid")).toBeVisible();
      const rowCount = await page.getByRole("row").count();
      expect(rowCount).toBeGreaterThan(1);
    });

    test("search users", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/users");
      
      // Search for user
      await page.getByPlaceholder(/search users/i).fill("test@example.com");
      await page.keyboard.press("Enter");
      
      // Verify search results
      await expect(page.getByText("test@example.com")).toBeVisible();
    });

    test("ban user", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/users");
      
      // Find and ban user
      const userRow = page.getByRole("row").filter({ hasText: "test@example.com" });
      await userRow.getByRole("button", { name: /ban/i }).click();
      
      // Confirm ban
      await page.getByRole("button", { name: /confirm/i }).click();
      
      // Verify ban status
      await expect(userRow.getByText(/banned/i)).toBeVisible();
      await expect(page.getByText(/user banned successfully/i)).toBeVisible();
    });

    test("unban user", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/users");
      
      // Find and unban user
      const userRow = page.getByRole("row").filter({ hasText: "banned@example.com" });
      await userRow.getByRole("button", { name: /unban/i }).click();
      
      // Confirm unban
      await page.getByRole("button", { name: /confirm/i }).click();
      
      // Verify unban status
      await expect(userRow.getByText(/active/i)).toBeVisible();
      await expect(page.getByText(/user unbanned successfully/i)).toBeVisible();
    });
  });

  test.describe('Video Management', () => {
    test("view video list", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/videos");
      
      // Verify video list elements
      await expect(page.getByRole("heading", { name: /videos/i })).toBeVisible();
      await expect(page.getByRole("grid")).toBeVisible();
      const rowCount = await page.getByRole("row").count();
      expect(rowCount).toBeGreaterThan(1);
    });

    test("search videos", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/videos");
      
      // Search for video
      await page.getByPlaceholder(/search videos/i).fill("test video");
      await page.keyboard.press("Enter");
      
      // Verify search results
      await expect(page.getByText("test video")).toBeVisible();
    });

    test("delete video", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/videos");
      
      // Find and delete video
      const videoRow = page.getByRole("row").filter({ hasText: "test video" });
      await videoRow.getByRole("button", { name: /delete/i }).click();
      
      // Confirm deletion
      await page.getByRole("button", { name: /confirm/i }).click();
      
      // Verify deletion
      await expect(videoRow).not.toBeVisible();
      await expect(page.getByText(/video deleted successfully/i)).toBeVisible();
    });

    test("feature/unfeature video", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/videos");
      
      // Find and feature video
      const videoRow = page.getByRole("row").filter({ hasText: "test video" });
      await videoRow.getByRole("button", { name: /feature/i }).click();
      
      // Verify featured status
      await expect(videoRow.getByText(/featured/i)).toBeVisible();
      
      // Unfeature video
      await videoRow.getByRole("button", { name: /unfeature/i }).click();
      
      // Verify unfeatured status
      await expect(videoRow.getByText(/featured/i)).not.toBeVisible();
    });
  });

  test.describe('Flag Management', () => {
    test("view flagged content", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/flags");
      
      // Verify flags list elements
      await expect(page.getByRole("heading", { name: /flagged content/i })).toBeVisible();
      await expect(page.getByRole("grid")).toBeVisible();
    });

    test("resolve flag", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/flags");
      
      // Find and resolve flag
      const flagRow = page.getByRole("row").first();
      await flagRow.getByRole("button", { name: /resolve/i }).click();
      
      // Select resolution
      await page.getByRole("radio", { name: /no action needed/i }).click();
      await page.getByRole("textbox", { name: /notes/i }).fill("Content reviewed, no issues found");
      await page.getByRole("button", { name: /submit/i }).click();
      
      // Verify resolution
      await expect(flagRow.getByText(/resolved/i)).toBeVisible();
      await expect(page.getByText(/flag resolved successfully/i)).toBeVisible();
    });

    test("take action on flag", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/flags");
      
      // Find and resolve flag
      const flagRow = page.getByRole("row").first();
      await flagRow.getByRole("button", { name: /resolve/i }).click();
      
      // Select action
      await page.getByRole("radio", { name: /remove content/i }).click();
      await page.getByRole("textbox", { name: /notes/i }).fill("Violated community guidelines");
      await page.getByRole("button", { name: /submit/i }).click();
      
      // Verify action taken
      await expect(flagRow.getByText(/content removed/i)).toBeVisible();
      await expect(page.getByText(/content removed successfully/i)).toBeVisible();
    });
  });

  test.describe('Analytics', () => {
    test("view analytics dashboard", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/insights");
      
      // Verify analytics elements
      await expect(page.getByRole("heading", { name: /insights/i })).toBeVisible();
      await expect(page.getByTestId("users-chart")).toBeVisible();
      await expect(page.getByTestId("videos-chart")).toBeVisible();
      await expect(page.getByTestId("engagement-chart")).toBeVisible();
    });

    test("filter analytics by date range", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/insights");
      
      // Select date range
      await page.getByRole("button", { name: /date range/i }).click();
      await page.getByRole("button", { name: /last month/i }).click();
      
      // Verify filtered data
      await expect(page.url()).toContain("range=last-month");
      await expect(page.getByTestId("date-range-indicator")).toContainText(/last month/i);
    });

    test("export analytics data", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/insights");
      
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole("button", { name: /export data/i }).click();
      
      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/analytics.*\.csv$/);
    });
  });

  test.describe('Error Handling', () => {
    test("network error handling", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/users");
      
      // Simulate network error
      await page.route('**/api/admin/**', route => route.abort('failed'));
      
      // Try to perform action
      await page.getByRole("button", { name: /ban/i }).first().click();
      await page.getByRole("button", { name: /confirm/i }).click();
      
      // Verify error handling
      await expect(page.getByText(/network error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("server error handling", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/users");
      
      // Simulate server error
      await page.route('**/api/admin/**', route => route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      }));
      
      // Try to perform action
      await page.getByRole("button", { name: /ban/i }).first().click();
      await page.getByRole("button", { name: /confirm/i }).click();
      
      // Verify error handling
      await expect(page.getByText(/server error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("retry functionality", async ({ page }) => {
      await page.goto("http://localhost:3000/admin/users");
      
      // Simulate temporary failure
      await page.route('**/api/admin/**', route => route.abort('failed'), { times: 1 });
      
      // Try to perform action
      await page.getByRole("button", { name: /ban/i }).first().click();
      await page.getByRole("button", { name: /confirm/i }).click();
      
      // Verify error and retry
      await expect(page.getByText(/network error/i)).toBeVisible();
      await page.getByRole("button", { name: /retry/i }).click();
      
      // Verify successful retry
      await expect(page.getByText(/user banned successfully/i)).toBeVisible();
    });
  });
});


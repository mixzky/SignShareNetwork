import { test, expect } from "@playwright/test";
import path from 'path';

test.describe('User Profile Management', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    // Login with test user
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Email").fill("testuser@example.com");
    await page.getByPlaceholder("Password").fill("password123");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test.describe('Profile View', () => {
    test("user can view their profile", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      
      // Verify profile elements
      await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();
      await expect(page.getByTestId("profile-image")).toBeVisible();
      await expect(page.getByText("testuser@example.com")).toBeVisible();
      await expect(page.getByRole("button", { name: /edit profile/i })).toBeVisible();
    });

    test("profile displays user statistics", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      
      // Verify statistics
      await expect(page.getByTestId("videos-count")).toBeVisible();
      await expect(page.getByTestId("followers-count")).toBeVisible();
      await expect(page.getByTestId("following-count")).toBeVisible();
      await expect(page.getByTestId("likes-count")).toBeVisible();
    });
  });

  test.describe('Profile Edit', () => {
    test("user can edit profile information", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      
      // Click edit button
      await page.getByRole("button", { name: /edit profile/i }).click();
      
      // Update profile information
      await page.getByLabel(/display name/i).fill("Updated Name");
      await page.getByLabel(/bio/i).fill("Updated bio information");
      await page.getByRole("button", { name: /save changes/i }).click();
      
      // Verify changes
      await expect(page.getByText("Updated Name")).toBeVisible();
      await expect(page.getByText("Updated bio information")).toBeVisible();
      await expect(page.getByText(/profile updated successfully/i)).toBeVisible();
    });

    test("profile edit form validation", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      await page.getByRole("button", { name: /edit profile/i }).click();
      
      // Test empty fields
      await page.getByLabel(/display name/i).fill("");
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page.getByText(/display name is required/i)).toBeVisible();
      
      // Test bio length limit
      await page.getByLabel(/bio/i).fill("a".repeat(501));
      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page.getByText(/bio must be less than/i)).toBeVisible();
    });

    test("user can upload profile picture", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      await page.getByRole("button", { name: /edit profile/i }).click();
      
      // Upload profile picture
      const fileInput = page.getByLabel(/profile picture/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'profile-pic.jpg'));
      
      // Verify upload success
      await expect(page.getByText(/image uploaded successfully/i)).toBeVisible();
      await expect(page.getByTestId("profile-image")).toHaveAttribute("src", /\/uploads\//);
    });

    test("profile picture upload validation", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      await page.getByRole("button", { name: /edit profile/i }).click();
      
      // Test invalid file type
      const fileInput = page.getByLabel(/profile picture/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'invalid.txt'));
      await expect(page.getByText(/invalid file type/i)).toBeVisible();
      
      // Test file size limit
      // Note: You'll need to create a large test file for this
      await expect(page.getByText(/file size must be less than/i)).toBeVisible();
    });
  });

  test.describe('Password Management', () => {
    test("user can change password", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/security");
      
      // Fill password change form
      await page.getByLabel(/current password/i).fill("password123");
      await page.getByLabel(/new password/i).fill("newpassword123");
      await page.getByLabel(/confirm password/i).fill("newpassword123");
      await page.getByRole("button", { name: /change password/i }).click();
      
      // Verify success
      await expect(page.getByText(/password changed successfully/i)).toBeVisible();
      
      // Verify can login with new password
      await page.getByRole("button", { name: /sign out/i }).click();
      await page.goto("http://localhost:3000/login");
      await page.getByPlaceholder("Email").fill("testuser@example.com");
      await page.getByPlaceholder("Password").fill("newpassword123");
      await page.getByRole("button", { name: /login/i }).click();
      await expect(page).toHaveURL("http://localhost:3000/");
    });

    test("password change validation", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/security");
      
      // Test incorrect current password
      await page.getByLabel(/current password/i).fill("wrongpassword");
      await page.getByLabel(/new password/i).fill("newpassword123");
      await page.getByLabel(/confirm password/i).fill("newpassword123");
      await page.getByRole("button", { name: /change password/i }).click();
      await expect(page.getByText(/current password is incorrect/i)).toBeVisible();
      
      // Test password mismatch
      await page.getByLabel(/current password/i).fill("password123");
      await page.getByLabel(/new password/i).fill("newpassword123");
      await page.getByLabel(/confirm password/i).fill("differentpassword");
      await page.getByRole("button", { name: /change password/i }).click();
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
      
      // Test password requirements
      await page.getByLabel(/new password/i).fill("short");
      await page.getByLabel(/confirm password/i).fill("short");
      await page.getByRole("button", { name: /change password/i }).click();
      await expect(page.getByText(/password must be at least/i)).toBeVisible();
    });
  });

  test.describe('Account Settings', () => {
    test("user can update notification preferences", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/settings");
      
      // Toggle notification settings
      await page.getByLabel(/email notifications/i).click();
      await page.getByLabel(/push notifications/i).click();
      await page.getByRole("button", { name: /save preferences/i }).click();
      
      // Verify changes
      await expect(page.getByText(/preferences saved/i)).toBeVisible();
      await expect(page.getByLabel(/email notifications/i)).not.toBeChecked();
      await expect(page.getByLabel(/push notifications/i)).not.toBeChecked();
    });

    test("user can update privacy settings", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/settings");
      
      // Update privacy settings
      await page.getByLabel(/private profile/i).click();
      await page.getByRole("button", { name: /save settings/i }).click();
      
      // Verify changes
      await expect(page.getByText(/settings saved/i)).toBeVisible();
      await expect(page.getByLabel(/private profile/i)).toBeChecked();
    });
  });

  test.describe('Error Handling', () => {
    test("network error during profile update", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      await page.getByRole("button", { name: /edit profile/i }).click();
      
      // Simulate network error
      await page.route('**/api/profile**', route => route.abort('failed'));
      
      // Try to update profile
      await page.getByLabel(/display name/i).fill("Updated Name");
      await page.getByRole("button", { name: /save changes/i }).click();
      
      // Verify error handling
      await expect(page.getByText(/network error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("server error during profile update", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      await page.getByRole("button", { name: /edit profile/i }).click();
      
      // Simulate server error
      await page.route('**/api/profile**', route => route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      }));
      
      // Try to update profile
      await page.getByLabel(/display name/i).fill("Updated Name");
      await page.getByRole("button", { name: /save changes/i }).click();
      
      // Verify error handling
      await expect(page.getByText(/server error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("retry functionality", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");
      await page.getByRole("button", { name: /edit profile/i }).click();
      
      // Simulate temporary failure
      await page.route('**/api/profile**', route => route.abort('failed'), { times: 1 });
      
      // Try to update profile
      await page.getByLabel(/display name/i).fill("Updated Name");
      await page.getByRole("button", { name: /save changes/i }).click();
      
      // Verify error and retry
      await expect(page.getByText(/network error/i)).toBeVisible();
      await page.getByRole("button", { name: /retry/i }).click();
      
      // Verify successful retry
      await expect(page.getByText(/profile updated successfully/i)).toBeVisible();
    });
  });
});

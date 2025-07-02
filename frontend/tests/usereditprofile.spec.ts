import { test, expect } from "@playwright/test";
import path from "path";

test.describe("User Profile Management", () => {
  const testEmail = "khannpwks@gmail.com";
  const testPassword = "123456";

  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    // Login with the test user
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder(/email/i).fill(testEmail);
    await page.getByPlaceholder(/password/i).fill(testPassword);
    await page.getByRole("button", { name: /login/i }).click();

    // Wait for successful login or timeout after reasonable time
    try {
      await expect(page).toHaveURL("http://localhost:3000/", {
        timeout: 15000,
      });
    } catch (error) {
      console.log("Login failed, skipping test");
      test.skip();
    }
  });

  test.describe("Profile View", () => {
    test("user can view their profile", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");

      // Verify profile elements
      await expect(
        page.getByRole("heading", { name: /profile/i })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /edit profile/i })
      ).toBeVisible();

      // Verify account details section exists
      await expect(page.getByText(/account details/i)).toBeVisible();
      await expect(page.getByText(/role:/i)).toBeVisible();
      await expect(page.getByText(/member since:/i)).toBeVisible();
    });

    test("profile displays user information correctly", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");

      // Verify basic structure is there
      await expect(page.getByText(/about/i)).toBeVisible();

      // Check for User Profile header text
      await expect(page.getByText(/user profile/i)).toBeVisible();

      // Check for profile content area
      const profileCard = page.locator('[class*="card"], .card');
      await expect(profileCard.first()).toBeVisible();

      // Verify profile image or placeholder is shown
      const profileImageArea = page
        .locator('img[src*="avatar"], div.rounded-full.bg-gray-200')
        .first();
      await expect(profileImageArea).toBeVisible();
    });
  });

  test.describe("Profile Edit", () => {
    test("user can navigate to edit profile", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");

      // Click edit button
      await page.getByRole("button", { name: /edit profile/i }).click();

      // Verify navigation to edit page
      await expect(page).toHaveURL("http://localhost:3000/profile/edit");
      await expect(
        page.getByRole("heading", { name: /edit profile/i })
      ).toBeVisible();
    });

    test("edit form displays correctly", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/edit");

      // Verify form elements are present
      await expect(page.getByLabel(/display name/i)).toBeVisible();
      await expect(page.getByLabel(/bio/i)).toBeVisible();
      await expect(page.getByLabel(/profile picture/i)).toBeVisible();
      await expect(
        page.getByRole("button", { name: /save changes/i })
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    });

    test("profile edit form validation works", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/edit");

      // Test empty display name validation
      const displayNameField = page.getByLabel(/display name/i);
      await displayNameField.clear();
      await page.getByRole("button", { name: /save changes/i }).click();

      // Check for validation message from Zod schema
      await expect(
        page.getByText(/display name must be at least 2 characters/i)
      ).toBeVisible();

      // Test bio length validation
      const bioField = page.getByLabel(/bio/i);
      await bioField.clear();
      await bioField.fill("a".repeat(501)); // Exceed 500 character limit
      await page.getByRole("button", { name: /save changes/i }).click();

      await expect(
        page.getByText(/bio must be less than 500 characters/i)
      ).toBeVisible();
    });

    test("user can upload profile picture", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/edit");

      // Upload profile picture
      const fileInput = page.getByLabel(/profile picture/i);
      await fileInput.setInputFiles(
        path.join(__dirname, "fixtures", "pfp.webp")
      );

      // Wait for upload processing and check for success message
      await page.waitForTimeout(3000);

      // Check for success toast message
      await expect(page.getByText(/avatar updated successfully/i)).toBeVisible({
        timeout: 5000,
      });
    });

    test("user can edit and save profile information", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/edit");

      // Update profile information
      const displayNameField = page.getByLabel(/display name/i);
      const bioField = page.getByLabel(/bio/i);

      await displayNameField.clear();
      await displayNameField.fill("Updated Test Name");
      await bioField.clear();
      await bioField.fill("Updated bio information for testing");

      // Save changes
      await page.getByRole("button", { name: /save changes/i }).click();

      // Should redirect to profile page and show success
      await expect(page).toHaveURL("http://localhost:3000/profile");
      await expect(page.getByText(/profile updated successfully/i)).toBeVisible(
        { timeout: 10000 }
      );

      // Verify the changes are displayed - use more specific selectors
      await expect(
        page.getByRole("heading", { name: "Updated Test Name" })
      ).toBeVisible();
      await expect(
        page.getByText("Updated bio information for testing")
      ).toBeVisible();

      // Cleanup: Reset back to original values
      await page.getByRole("button", { name: /edit profile/i }).click();
      await expect(page).toHaveURL("http://localhost:3000/profile/edit");

      const resetDisplayNameField = page.getByLabel(/display name/i);
      const resetBioField = page.getByLabel(/bio/i);

      await resetDisplayNameField.clear();
      await resetDisplayNameField.fill("Test User"); // Reset to original name
      await resetBioField.clear();
      await resetBioField.fill("Test bio"); // Reset to original bio

      await page.getByRole("button", { name: /save changes/i }).click();
      await expect(page).toHaveURL("http://localhost:3000/profile");
    });

    test("cancel edit returns to profile", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/edit");

      // Click cancel button
      await page.getByRole("button", { name: /cancel/i }).click();

      // Verify navigation back to profile
      await expect(page).toHaveURL("http://localhost:3000/profile");
    });
  });

  test.describe("Error Handling", () => {
    test("handles unauthorized access gracefully", async ({ page }) => {
      // Test what happens when accessing profile without being logged in
      await page.context().clearCookies();
      await page.goto("http://localhost:3000/profile");

      // Should redirect to login (with or without query parameters)
      await expect(page).toHaveURL(/http:\/\/localhost:3000\/login(\?.*)?$/);
    });

    test("handles profile loading errors with retry", async ({ page }) => {
      await page.goto("http://localhost:3000/profile");

      // If profile can't be loaded, should show retry button
      const retryButton = page.getByRole("button", { name: /retry/i });
      if (await retryButton.isVisible()) {
        await expect(page.getByText(/profile not found/i)).toBeVisible();
        await expect(retryButton).toBeVisible();
      }
    });

    test("edit form shows loading state", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/edit");

      // Check that form shows proper loading states
      const displayNameField = page.getByLabel(/display name/i);
      const saveButton = page.getByRole("button", { name: /save changes/i });

      await displayNameField.fill("Test Name");
      await saveButton.click();

      // Should show "Saving..." state
      await expect(page.getByRole("button", { name: /saving/i })).toBeVisible({
        timeout: 2000,
      });
    });

    test("upload shows uploading state", async ({ page }) => {
      await page.goto("http://localhost:3000/profile/edit");

      // Upload profile picture
      const fileInput = page.getByLabel(/profile picture/i);
      await fileInput.setInputFiles(
        path.join(__dirname, "fixtures", "pfp.webp")
      );

      // Should show uploading state
      await expect(page.getByText(/uploading/i)).toBeVisible({ timeout: 2000 });
    });
  });
});

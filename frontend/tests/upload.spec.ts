import { test, expect } from "@playwright/test";
import path from 'path';

test.describe("Video Upload Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login before each test
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Email").fill("testuser_862694@example.com");
    await page.getByPlaceholder("Password").fill("TestPassword123");
    await page.getByRole("button", { name: /login/i }).click();
    
    // Wait for auth session to be established (increased timeout)
    await page.waitForTimeout(5000); // Increased wait time for auth
    await expect(page).toHaveURL("http://localhost:3000/");
    
    // Navigate to country page
    await page.goto("http://localhost:3000/country/764");
    await page.waitForLoadState('networkidle');
  });

  test.describe("Country Page Upload", () => {
    test("can access upload dialog", async ({ page }) => {
      await page.getByRole('button', { name: 'Upload Your Video' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/Drag & drop or click to select a video file/)).toBeVisible();
    });

    test("file upload validation", async ({ page }) => {
      await page.getByRole('button', { name: 'Upload Your Video' }).click();
      
      // Try to submit without a file
      await page.getByRole('button', { name: 'Upload Video' }).click();
      await expect(page.getByText('Title is required')).toBeVisible();
      await expect(page.getByText('Description is required')).toBeVisible();
      await expect(page.getByText('Language is required')).toBeVisible();
      await expect(page.getByText('Region is required')).toBeVisible();
    });

    test("form validation", async ({ page }) => {
      await page.getByRole('button', { name: 'Upload Your Video' }).click();
      
      // Find the file input and upload the test video
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      
      // Try to submit without required fields
      await page.getByRole('button', { name: 'Upload Video' }).click();
      await expect(page.getByText('Title is required')).toBeVisible();
      await expect(page.getByText('Description is required')).toBeVisible();
      await expect(page.getByText('Language is required')).toBeVisible();
      await expect(page.getByText('Region is required')).toBeVisible();
      
      // Fill only title
      await page.getByRole('textbox', { name: 'Title' }).fill('Test Title');
      await page.getByRole('button', { name: 'Upload Video' }).click();
      await expect(page.getByText('Description is required')).toBeVisible();
    });

    test("successful upload flow", async ({ page }) => {
      // Open upload dialog
      await page.getByRole('button', { name: 'Upload Your Video' }).click();
      
      // Upload video file
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));

      // Fill in video details
      await page.getByRole('textbox', { name: 'Title' }).fill('Test Upload Video');
      await page.getByRole('textbox', { name: 'Description' }).fill('Test video description');
      await page.getByRole('textbox', { name: 'Language' }).fill('Thai');
      await page.getByRole('textbox', { name: 'Region' }).fill('Thailand');

      // Submit upload
      await page.getByRole('button', { name: 'Upload Video' }).click();

      // Wait for upload to complete and check success message
      await expect(page.getByText('Video uploaded successfully')).toBeVisible({ timeout: 15000 });
      
    });

    test("error handling", async ({ page }) => {
      await page.getByRole('button', { name: 'Upload Your Video' }).click();
      
      // Simulate network error
      await page.route('**/storage/v1/object/**', route => route.abort('failed'));
      
      // Upload video file
      const fileInput = await page.locator('input[type="file"]');
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      
      // Fill in video details
      await page.getByRole('textbox', { name: 'Title' }).fill('Test Video');
      await page.getByRole('textbox', { name: 'Description' }).fill('Test Description');
      await page.getByRole('textbox', { name: 'Language' }).fill('Thai');
      await page.getByRole('textbox', { name: 'Region' }).fill('Thailand');
      
      // Submit and verify error handling
      await page.getByRole('button', { name: 'Upload Video' }).click();
      await expect(page.getByText('Failed to upload video. Please try again.')).toBeVisible();
    });
  });
});

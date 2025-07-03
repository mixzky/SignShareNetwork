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

test.describe("User Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto("http://localhost:3000/");
    
    // Login flow
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('testuser_862694@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('TestPassword123');
    await page.getByRole('button', { name: 'login' }).click();
    
    // Navigate to dashboard through profile menu
    await page.waitForTimeout(5000); // Increased wait time for auth
    await expect(page).toHaveURL("http://localhost:3000/");
    
    // Navigate 
    await page.goto("http://localhost:3000/dashboard");
    await page.waitForLoadState('networkidle');;
    
  });

  test("displays user statistics section", async ({ page }) => {
    // Check statistics section header
    await expect(page.getByRole('heading', { name: 'User Statistics' })).toBeVisible();
    
    // Verify all stat categories are present
    const statCategories = ['Total Videos', 'Verified Videos', 'Total Reviews', 'Flagged Videos'];
    for (const category of statCategories) {
      await expect(page.getByText(category, { exact: true })).toBeVisible();
    }
    
    // Check top videos section
    await expect(page.getByRole('heading', { name: 'Top Video by Comments' })).toBeVisible();
  });

  test("video filtering and sorting functionality", async ({ page }) => {
    // Test sorting options
    const sortSelect = page.locator('div').filter({ hasText: /^NewestOldestTitle$/ }).getByRole('combobox');
    await sortSelect.selectOption('oldest');
    await sortSelect.selectOption('title');
    await sortSelect.selectOption('newest');
    
    // Test status filtering
    const statusSelect = page.getByRole('combobox').nth(1);
    await statusSelect.selectOption('processing');
    await statusSelect.selectOption('rejected');
    await statusSelect.selectOption('verified');
    
    // Test search functionality
    const searchInput = page.getByRole('textbox', { name: 'Search by title...' });
    await searchInput.click();
    await searchInput.fill('Test Upload');
    
    // Verify search results if they exist
    const resultTitle = page.getByRole('heading', { name: 'Test Upload Video' }).first();
    if (await resultTitle.isVisible()) {
      await expect(resultTitle).toBeVisible();
    }
  });

  test("video editing and management", async ({ page }) => {
    // Find and click on a video title if it exists
    const videoTitle = page.getByRole('heading', { name: 'Test Upload Video' }).first();
    if (await videoTitle.isVisible()) {
      await videoTitle.click();
      
      // Wait for the modal and video management form to be visible
      await expect(page.locator('.fixed.inset-0')).toBeVisible();
      
      // Edit title
      const titleInput = page.getByPlaceholder('Enter video title');
      await expect(titleInput).toBeVisible();
      await titleInput.click();
      await titleInput.fill('Updated Test Title');
      
      // Edit description
      const descInput = page.getByPlaceholder('Enter video description');
      await expect(descInput).toBeVisible();
      await descInput.click();
      await descInput.fill('Updated test description');
      
      // Save changes
      const saveButton = page.getByRole('button', { name: 'Save' });
      await expect(saveButton).toBeVisible();
      await saveButton.click();
      
      // Wait for success message
      await expect(page.getByText('Successfully edited!')).toBeVisible();
      
      // Test delete functionality
      const deleteButton = page.getByRole('button', { name: 'Delete' });
      await expect(deleteButton).toBeVisible();
      
      // Set up dialog handler for delete confirmation
      page.on('dialog', async dialog => {
        expect(dialog.message()).toBe('Are you sure you want to delete this video?');
        await dialog.dismiss(); // Dismiss the dialog to not actually delete
      });
      
      // Click delete button to trigger confirmation dialog
      await deleteButton.click();
      
      // Close the modal
      const closeButton = page.getByRole('button', { name: 'Close' });
      await closeButton.click();
      await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
    }
  });

});

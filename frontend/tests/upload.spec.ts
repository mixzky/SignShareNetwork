import { test, expect } from "@playwright/test";
import path from 'path';

test.describe('Video Upload', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Email").fill("testuser@example.com");
    await page.getByPlaceholder("Password").fill("password123");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test.describe('Upload Page Access', () => {
    test("authenticated user can access upload page", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Verify upload page elements
      await expect(page.getByRole("heading", { name: /upload video/i })).toBeVisible();
      await expect(page.getByText(/drag and drop/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /select file/i })).toBeVisible();
    });

    test("unauthenticated user cannot access upload page", async ({ page }) => {
      // Logout first
      await page.getByRole("button", { name: /sign out/i }).click();
      
      // Try to access upload page
      await page.goto("http://localhost:3000/upload");
      await expect(page).toHaveURL("http://localhost:3000/login");
      await expect(page.getByText(/please login to upload/i)).toBeVisible();
    });
  });

  test.describe('File Selection', () => {
    test("user can select file using button", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Select file using button
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      
      // Verify file selected
      await expect(page.getByText(/test-video\.mp4/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /start upload/i })).toBeEnabled();
    });

    test("user can drag and drop file", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Simulate drag and drop
      await page.evaluate(() => {
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: new DataTransfer()
        });
        document.querySelector('.drop-zone')?.dispatchEvent(dropEvent);
      });
      
      // Set file after drop simulation
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      
      // Verify file accepted
      await expect(page.getByText(/test-video\.mp4/i)).toBeVisible();
    });

    test("file type validation", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Try to upload invalid file type
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'invalid.txt'));
      
      // Verify error message
      await expect(page.getByText(/invalid file type/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /start upload/i })).toBeDisabled();
    });

    test("file size validation", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Note: You'll need a large test file for this
      await expect(page.getByText(/file size must be less than/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /start upload/i })).toBeDisabled();
    });
  });

  test.describe('Upload Form', () => {
    test("upload form validation", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Select valid file
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      
      // Try to submit without required fields
      await page.getByRole("button", { name: /start upload/i }).click();
      await expect(page.getByText(/title is required/i)).toBeVisible();
      await expect(page.getByText(/description is required/i)).toBeVisible();
      
      // Test title length validation
      await page.getByLabel(/title/i).fill("a".repeat(101));
      await expect(page.getByText(/title must be less than/i)).toBeVisible();
      
      // Test description length validation
      await page.getByLabel(/description/i).fill("a".repeat(1001));
      await expect(page.getByText(/description must be less than/i)).toBeVisible();
    });

    test("category and tags selection", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Select file
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      
      // Select category
      await page.getByRole("combobox", { name: /category/i }).selectOption("education");
      
      // Add tags
      await page.getByRole("textbox", { name: /tags/i }).fill("sign language");
      await page.keyboard.press("Enter");
      await page.getByRole("textbox", { name: /tags/i }).fill("tutorial");
      await page.keyboard.press("Enter");
      
      // Verify selections
      await expect(page.getByText(/education/i)).toBeVisible();
      await expect(page.getByText(/sign language/i)).toBeVisible();
      await expect(page.getByText(/tutorial/i)).toBeVisible();
    });

    test("thumbnail selection", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Select file
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      
      // Wait for video processing
      await expect(page.getByText(/generating thumbnails/i)).toBeVisible();
      await expect(page.getByTestId("thumbnail-options")).toBeVisible();
      
      // Select thumbnail
      await page.getByRole("radio", { name: /thumbnail/i }).first().click();
      await expect(page.getByText(/thumbnail selected/i)).toBeVisible();
    });
  });

  test.describe('Upload Process', () => {
    test("successful upload process", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Select file
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      
      // Fill form
      await page.getByLabel(/title/i).fill("Test Video");
      await page.getByLabel(/description/i).fill("This is a test video");
      await page.getByRole("combobox", { name: /category/i }).selectOption("education");
      
      // Start upload
      await page.getByRole("button", { name: /start upload/i }).click();
      
      // Verify upload progress
      await expect(page.getByRole("progressbar")).toBeVisible();
      await expect(page.getByText(/uploading/i)).toBeVisible();
      
      // Verify completion
      await expect(page.getByText(/upload complete/i)).toBeVisible();
      await expect(page.getByRole("link", { name: /view video/i })).toBeVisible();
    });

    test("upload progress indication", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Select file and start upload
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      await page.getByLabel(/title/i).fill("Test Video");
      await page.getByLabel(/description/i).fill("This is a test video");
      await page.getByRole("button", { name: /start upload/i }).click();
      
      // Verify progress updates
      await expect(page.getByRole("progressbar")).toBeVisible();
      await expect(page.getByText(/processing/i)).toBeVisible();
      await expect(page.getByText(/upload complete/i)).toBeVisible();
    });

    test("cancel upload", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Start upload
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      await page.getByLabel(/title/i).fill("Test Video");
      await page.getByLabel(/description/i).fill("This is a test video");
      await page.getByRole("button", { name: /start upload/i }).click();
      
      // Cancel upload
      await page.getByRole("button", { name: /cancel/i }).click();
      await page.getByRole("button", { name: /confirm cancel/i }).click();
      
      // Verify cancellation
      await expect(page.getByText(/upload cancelled/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /start upload/i })).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test("network error during upload", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Simulate network error
      await page.route('**/api/upload**', route => route.abort('failed'));
      
      // Start upload
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      await page.getByLabel(/title/i).fill("Test Video");
      await page.getByLabel(/description/i).fill("This is a test video");
      await page.getByRole("button", { name: /start upload/i }).click();
      
      // Verify error handling
      await expect(page.getByText(/network error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("server error during upload", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Simulate server error
      await page.route('**/api/upload**', route => route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      }));
      
      // Start upload
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      await page.getByLabel(/title/i).fill("Test Video");
      await page.getByLabel(/description/i).fill("This is a test video");
      await page.getByRole("button", { name: /start upload/i }).click();
      
      // Verify error handling
      await expect(page.getByText(/server error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("retry functionality", async ({ page }) => {
      await page.goto("http://localhost:3000/upload");
      
      // Simulate temporary failure
      await page.route('**/api/upload**', route => route.abort('failed'), { times: 1 });
      
      // Start upload
      const fileInput = page.getByLabel(/choose video/i);
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-video.mp4'));
      await page.getByLabel(/title/i).fill("Test Video");
      await page.getByLabel(/description/i).fill("This is a test video");
      await page.getByRole("button", { name: /start upload/i }).click();
      
      // Verify error and retry
      await expect(page.getByText(/network error/i)).toBeVisible();
      await page.getByRole("button", { name: /retry/i }).click();
      
      // Verify successful retry
      await expect(page.getByText(/upload complete/i)).toBeVisible();
    });
  });
});

//TODO: implemenet more advance user flwo
test("upload video", async ({
  page,
}) => {
  const email = "khannpwks173@gmail.com";
  const password = "123456";

  // Go to login page
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await page.goto("http://localhost:3000/country/764");
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('button', { name: 'Upload Your Video' }).click();
  await page.locator('div').filter({ hasText: /^Drag & drop or click to select a video file$/ }).click();
  await page.getByRole('dialog', { name: 'Upload Sign Language Video' }).setInputFiles('Download (5).mp4');
  await page.getByRole('textbox', { name: 'Title' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('abcd');
  await page.getByRole('textbox', { name: 'Description' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill('hello test test');
  await page.getByRole('textbox', { name: 'Language' }).click();
  await page.getByRole('textbox', { name: 'Language' }).fill('Thai');
  await page.getByRole('textbox', { name: 'Region' }).click();
  await page.getByRole('textbox', { name: 'Region' }).fill('Thailand');
  await page.getByRole('button', { name: 'Upload Video' }).click();
  await page.goto('http://localhost:3000/country/764');
  await page.getByText('Video uploaded successfully').click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('heading', { name: 'abcd' }).click();
  await page.getByRole('textbox', { name: 'Enter video title' }).click();
  await page.getByRole('textbox', { name: 'Enter video description' }).click();
  await page.getByText('Tags', { exact: true }).click();
  
});



  
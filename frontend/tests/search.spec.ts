import { test, expect } from "@playwright/test";

// Helper function to login
async function loginUser(page: any) {
  await page.goto("http://localhost:3000/login");

  // Wait for login form to load
  await page.waitForSelector('input[placeholder="Enter your email address"]', {
    timeout: 10000,
  });

  // Fill in the login form
  await page
    .getByPlaceholder("Enter your email address")
    .fill("hahahoho@test.com");
  await page.getByPlaceholder("Enter your password").fill("123456aA");

  // Submit the login form - the button text is "login" not "Sign in"
  await page.getByRole("button", { name: "login" }).click();

  // Wait for successful login and redirect to home page
  await page.waitForURL("http://localhost:3000/", { timeout: 10000 });

  // Verify we're logged in by checking for user-specific elements or URL
  // Since we're not sure about the exact selectors, let's just verify the URL for now
  await page.waitForTimeout(2000); // Give time for any additional loading
}

test.describe("Search and Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("should search for a country and navigate successfully", async ({
    page,
  }) => {
    // Test searching for "United States"
    const searchInput = page.locator('input[placeholder="Find countries..."]');
    await expect(searchInput).toBeVisible();

    // Type a country name
    await searchInput.fill("United States");

    // Wait for suggestions to appear
    await page.waitForSelector("ul", { timeout: 5000 });

    // Verify suggestions are visible
    const suggestionsContainer = page.locator("ul");
    await expect(suggestionsContainer).toBeVisible();

    // Click on the first suggestion (should contain "United States")
    const firstSuggestion = page.locator("li").first();
    await expect(firstSuggestion).toContainText("United States");
    await firstSuggestion.click();

    // Verify the search input is filled with the selected country (actual name from API)
    await expect(searchInput).toHaveValue("United States of America");

    // Submit the search form
    const searchButton = page.locator('button[aria-label="Search"]');
    await searchButton.click();

    // Wait for the loading state and navigation
    const loadingSpinner = page
      .locator("text=United States of America")
      .first(); // From CountryLoading component
    await expect(loadingSpinner).toBeVisible({ timeout: 3000 });

    // Wait for navigation to the country page (with 2 second delay from the code)
    await page.waitForURL("**/country/**", { timeout: 5000 });

    // Verify we're on the correct country page
    expect(page.url()).toMatch(/\/country\/\d+/);

    // Verify the country page has loaded content - look for specific country page elements
    await expect(page.locator("text=Now :")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Upload Your Video")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should search with form submission without suggestions", async ({
    page,
  }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');

    // Type a full country name and submit directly
    await searchInput.fill("Japan");

    // Submit the form by pressing Enter
    await searchInput.press("Enter");

    // Wait for loading state - be more flexible with the country name
    await expect(page.locator("text=Japan").first()).toBeVisible({
      timeout: 3000,
    });

    // Wait for navigation
    await page.waitForURL("**/country/**", { timeout: 5000 });

    // Verify we're on a country page
    expect(page.url()).toMatch(/\/country\/\d+/);

    // Verify the country page content has loaded
    await expect(page.locator("text=Now :")).toBeVisible({ timeout: 5000 });
  });

  test("should handle partial country name searches", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');

    // Type partial country name
    await searchInput.fill("fran");

    // Wait for suggestions
    await page.waitForSelector("ul", { timeout: 5000 });

    // Check that France appears in suggestions
    const franceOption = page.locator("li", { hasText: "France" });
    await expect(franceOption).toBeVisible();

    // Click on France
    await franceOption.click();

    // Verify the input is filled with France (should be exact match)
    await expect(searchInput).toHaveValue("France");

    // Submit the search
    const searchButton = page.locator('button[aria-label="Search"]');
    await searchButton.click();

    // Wait for navigation
    await page.waitForURL("**/country/**", { timeout: 5000 });
    expect(page.url()).toMatch(/\/country\/\d+/);
  });

  test("should clear suggestions when input loses focus", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');

    // Type to trigger suggestions
    await searchInput.fill("can");

    // Wait for suggestions to appear
    await page.waitForSelector("ul", { timeout: 5000 });
    const suggestionsContainer = page.locator("ul");
    await expect(suggestionsContainer).toBeVisible();

    // Click somewhere else to blur the input
    await page.locator("main").click();

    // Wait for suggestions to disappear (150ms delay in the code)
    await page.waitForTimeout(200);
    await expect(suggestionsContainer).not.toBeVisible();
  });

  test("should show visual feedback when search input is focused", async ({
    page,
  }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');
    const searchContainer = searchInput.locator("..");

    // Focus the input
    await searchInput.focus();

    // Check for focused state styling (enhanced border/background)
    await expect(searchContainer).toHaveClass(/border-blue-400\/60/);

    // Blur the input
    await page.locator("main").click();

    // Check that focused state is removed
    await expect(searchContainer).toHaveClass(/border-gray-400\/30/);
  });

  test("should handle search for non-existent country gracefully", async ({
    page,
  }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');

    // Search for a non-existent country
    await searchInput.fill("Atlantis");
    await searchInput.press("Enter");

    // Should not navigate anywhere - we should still be on the home page
    await page.waitForTimeout(3000);
    expect(page.url()).toBe("http://localhost:3000/");

    // The search input should still contain the search term
    await expect(searchInput).toHaveValue("Atlantis");
  });

  test("should ignore single character searches", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');

    // Type a single character
    await searchInput.fill("a");
    await searchInput.press("Enter");

    // Should not navigate or show loading
    await page.waitForTimeout(1000);
    expect(page.url()).toBe("http://localhost:3000/");

    // No suggestions should appear
    await expect(page.locator("ul")).not.toBeVisible();
  });

  test("should require at least 2 characters for suggestions", async ({
    page,
  }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');

    // Type one character
    await searchInput.fill("u");

    // No suggestions should appear
    await page.waitForTimeout(500);
    await expect(page.locator("ul")).not.toBeVisible();

    // Type second character
    await searchInput.fill("un");

    // Now suggestions should appear
    await page.waitForSelector("ul", { timeout: 3000 });
    await expect(page.locator("ul")).toBeVisible();
  });

  test("should clear search input after successful navigation", async ({
    page,
  }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');

    // Search for a country
    await searchInput.fill("Canada");
    await searchInput.press("Enter");

    // Wait a moment for the clear logic to execute (before navigation)
    await page.waitForTimeout(1000);

    // The search input should be cleared
    await expect(searchInput).toHaveValue("");
  });

  test("should display maximum 5 suggestions", async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Find countries..."]');

    // Type a search that would match many countries
    await searchInput.fill("a");
    await searchInput.fill("al"); // Countries starting with "al"

    // Wait for suggestions
    await page.waitForSelector("ul", { timeout: 5000 });

    // Count suggestions - should be maximum 5
    const suggestions = page.locator("li");
    const count = await suggestions.count();
    expect(count).toBeLessThanOrEqual(5);
  });
});

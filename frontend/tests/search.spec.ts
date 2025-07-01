import { test, expect } from "@playwright/test";

test("user can search for Thailand and navigate to country page", async ({
  page,
}) => {
  const email = "khannpwks173@gmail.com";
  const password = "123456";

  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  // Go to the homepage

  // Focus the search input and type "Thailand"
  await page.getByPlaceholder("Find countries...").fill("Thai");

  // Wait for suggestion to appear and click it
  await page.getByText("Thailand", { exact: true }).click();

  // Submit the search form (if needed, otherwise the click may be enough)
  // await page.getByRole("button", { name: /search/i }).click();
  await page.getByRole("button", { name: /search/i }).click();
  // Wait for navigation to the Thailand country page
  await expect(page).toHaveURL(/\/country\/764|thailand/i);

  // Check that the country name is visible on the page
  await expect(page.getByText(/thailand/i)).toBeVisible();

  await page
    .getByRole("button", { name: /khannpwks173@gmail.com|updated name/i })
    .click();

  // Log out again
  await page.getByText(/sign out/i).waitFor({ state: "visible" });
  await page.getByText(/sign out/i).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
});

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test.describe('Search Bar', () => {
    test("search bar is accessible", async ({ page }) => {
      const searchBar = page.getByPlaceholder(/search/i);
      await expect(searchBar).toBeVisible();
      await expect(searchBar).toBeEnabled();
    });

    test("search bar responsiveness", async ({ page }) => {
      const searchBar = page.getByPlaceholder(/search/i);
      
      // Test focus state
      await searchBar.click();
      await expect(searchBar).toBeFocused();
      
      // Test clear button
      await searchBar.fill("test");
      await expect(page.getByRole("button", { name: /clear/i })).toBeVisible();
      await page.getByRole("button", { name: /clear/i }).click();
      await expect(searchBar).toHaveValue("");
    });

    test("search suggestions appear", async ({ page }) => {
      const searchBar = page.getByPlaceholder(/search/i);
      
      // Type slowly to trigger suggestions
      await searchBar.type("sign", { delay: 100 });
      
      // Verify suggestions
      await expect(page.getByRole("listbox")).toBeVisible();
      const suggestions = page.getByRole("option");
      const count = await suggestions.count();
      expect(count).toBeGreaterThan(0);
      
      // Test suggestion interaction
      await suggestions.first().click();
      await expect(page).toHaveURL(/\/videos\//);
    });
  });

  test.describe('Search Results', () => {
    test("basic search functionality", async ({ page }) => {
      // Perform search
      await page.getByPlaceholder(/search/i).fill("test video");
      await page.keyboard.press("Enter");
      
      // Verify search results page
      await expect(page).toHaveURL(/\/search\?q=test%20video/);
      await expect(page.getByRole("heading", { name: /search results/i })).toBeVisible();
      await expect(page.getByTestId("search-results")).toBeVisible();
    });

    test("search results display", async ({ page }) => {
      // Perform search
      await page.getByPlaceholder(/search/i).fill("sign language");
      await page.keyboard.press("Enter");
      
      // Verify result items
      const results = page.getByTestId("search-result-item");
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
      
      // Verify result item content
      const firstResult = results.first();
      await expect(firstResult.getByRole("heading")).toBeVisible();
      await expect(firstResult.getByRole("img")).toBeVisible();
      await expect(firstResult.getByText(/views/i)).toBeVisible();
      await expect(firstResult.getByText(/uploaded/i)).toBeVisible();
    });

    test("no results found", async ({ page }) => {
      // Search for unlikely term
      await page.getByPlaceholder(/search/i).fill("xyzabc123nonexistent");
      await page.keyboard.press("Enter");
      
      // Verify no results message
      await expect(page.getByText(/no results found/i)).toBeVisible();
      await expect(page.getByText(/try different keywords/i)).toBeVisible();
    });

    test("search filters", async ({ page }) => {
      // Perform search
      await page.getByPlaceholder(/search/i).fill("sign language");
      await page.keyboard.press("Enter");
      
      // Apply filters
      await page.getByRole("combobox", { name: /sort by/i }).selectOption("most-recent");
      await expect(page.url()).toContain("sort=most-recent");
      
      await page.getByRole("combobox", { name: /category/i }).selectOption("education");
      await expect(page.url()).toContain("category=education");
      
      await page.getByRole("combobox", { name: /duration/i }).selectOption("short");
      await expect(page.url()).toContain("duration=short");
      
      // Verify filtered results
      await expect(page.getByTestId("search-results")).toBeVisible();
    });

    test("search pagination", async ({ page }) => {
      // Perform search with many results
      await page.getByPlaceholder(/search/i).fill("sign");
      await page.keyboard.press("Enter");
      
      // Verify pagination controls
      await expect(page.getByRole("navigation", { name: /pagination/i })).toBeVisible();
      
      // Navigate pages
      await page.getByRole("button", { name: /next page/i }).click();
      await expect(page.url()).toContain("page=2");
      
      await page.getByRole("button", { name: /previous page/i }).click();
      await expect(page.url()).toContain("page=1");
    });
  });

  test.describe('Search History', () => {
    test("recent searches", async ({ page }) => {
      // Perform multiple searches
      const searches = ["sign language", "tutorial", "beginner"];
      for (const term of searches) {
        await page.getByPlaceholder(/search/i).fill(term);
        await page.keyboard.press("Enter");
        await page.goto("http://localhost:3000"); // Go back to home
      }
      
      // Open search and check history
      await page.getByPlaceholder(/search/i).click();
      for (const term of searches) {
        await expect(page.getByRole("listbox").getByText(term)).toBeVisible();
      }
    });

    test("clear search history", async ({ page }) => {
      // Perform search
      await page.getByPlaceholder(/search/i).fill("test search");
      await page.keyboard.press("Enter");
      await page.goto("http://localhost:3000");
      
      // Open search and clear history
      await page.getByPlaceholder(/search/i).click();
      await page.getByRole("button", { name: /clear history/i }).click();
      
      // Verify history is cleared
      await expect(page.getByText(/no recent searches/i)).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test("network error during search", async ({ page }) => {
      // Simulate network error
      await page.route('**/api/search**', route => route.abort('failed'));
      
      // Attempt search
      await page.getByPlaceholder(/search/i).fill("test");
      await page.keyboard.press("Enter");
      
      // Verify error handling
      await expect(page.getByText(/network error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("server error during search", async ({ page }) => {
      // Simulate server error
      await page.route('**/api/search**', route => route.fulfill({
        status: 500,
        body: 'Internal Server Error'
      }));
      
      // Attempt search
      await page.getByPlaceholder(/search/i).fill("test");
      await page.keyboard.press("Enter");
      
      // Verify error handling
      await expect(page.getByText(/server error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("retry functionality", async ({ page }) => {
      // Simulate temporary failure
      await page.route('**/api/search**', route => route.abort('failed'), { times: 1 });
      
      // Attempt search
      await page.getByPlaceholder(/search/i).fill("test");
      await page.keyboard.press("Enter");
      
      // Verify error and retry
      await expect(page.getByText(/network error/i)).toBeVisible();
      await page.getByRole("button", { name: /retry/i }).click();
      
      // Verify successful retry
      await expect(page.getByTestId("search-results")).toBeVisible();
    });
  });
});

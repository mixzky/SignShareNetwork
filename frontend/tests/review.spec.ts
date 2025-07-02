import { test, expect } from "@playwright/test";

test.describe("Video Review System", () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
    await page.getByPlaceholder("Email").fill("khannpwks@gmail.com");
    await page.getByPlaceholder("Password").fill("123456");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page).toHaveURL("http://localhost:3000/");
  });

  test.describe("Review Form", () => {
    test("review form is accessible", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Verify review section elements
      await expect(
        page.getByRole("heading", { name: /reviews/i })
      ).toBeVisible();
      await expect(
        page.getByRole("textbox", { name: /write a review/i })
      ).toBeVisible();
      await expect(page.getByRole("button", { name: /submit/i })).toBeVisible();
      await expect(page.getByRole("group", { name: /rating/i })).toBeVisible();
    });

    test("successful review submission", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Fill review form
      await page
        .getByRole("textbox", { name: /write a review/i })
        .fill("This is a great video!");
      await page.getByRole("radio", { name: /5 stars/i }).click();
      await page.getByRole("button", { name: /submit/i }).click();

      // Verify success
      await expect(page.getByText(/review submitted/i)).toBeVisible();
      await expect(page.getByText("This is a great video!")).toBeVisible();
    });

    test("review form validation", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Empty review submission
      await page.getByRole("button", { name: /submit/i }).click();
      await expect(page.getByText(/review text is required/i)).toBeVisible();
      await expect(page.getByText(/rating is required/i)).toBeVisible();

      // Review too short
      await page.getByRole("textbox", { name: /write a review/i }).fill("Hi");
      await page.getByRole("button", { name: /submit/i }).click();
      await expect(page.getByText(/review must be at least/i)).toBeVisible();

      // Review too long
      await page
        .getByRole("textbox", { name: /write a review/i })
        .fill("a".repeat(1001));
      await page.getByRole("button", { name: /submit/i }).click();
      await expect(page.getByText(/review must be less than/i)).toBeVisible();
    });
  });

  test.describe("Review Display", () => {
    test("reviews are displayed correctly", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Submit a review first
      await page
        .getByRole("textbox", { name: /write a review/i })
        .fill("Test review content");
      await page.getByRole("radio", { name: /4 stars/i }).click();
      await page.getByRole("button", { name: /submit/i }).click();

      // Verify review display
      const review = page.getByTestId("review-item").first();
      await expect(review.getByText("Test review content")).toBeVisible();
      await expect(review.getByText(/4 stars/i)).toBeVisible();
      await expect(review.getByText(/just now/i)).toBeVisible();
      await expect(review.getByText("testuser")).toBeVisible();
    });

    test("review sorting", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Verify sort options
      await page
        .getByRole("combobox", { name: /sort reviews/i })
        .selectOption("newest");
      await expect(page.url()).toContain("sort=newest");

      await page
        .getByRole("combobox", { name: /sort reviews/i })
        .selectOption("highest-rated");
      await expect(page.url()).toContain("sort=highest-rated");

      await page
        .getByRole("combobox", { name: /sort reviews/i })
        .selectOption("lowest-rated");
      await expect(page.url()).toContain("sort=lowest-rated");
    });

    test("review pagination", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Verify pagination controls
      await expect(
        page.getByRole("navigation", { name: /review pagination/i })
      ).toBeVisible();

      // Navigate pages
      await page.getByRole("button", { name: /next page/i }).click();
      await expect(page.url()).toContain("review_page=2");

      await page.getByRole("button", { name: /previous page/i }).click();
      await expect(page.url()).toContain("review_page=1");
    });
  });

  test.describe("Review Management", () => {
    test("user can edit their review", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Submit initial review
      await page
        .getByRole("textbox", { name: /write a review/i })
        .fill("Initial review");
      await page.getByRole("radio", { name: /3 stars/i }).click();
      await page.getByRole("button", { name: /submit/i }).click();

      // Edit review
      await page.getByRole("button", { name: /edit review/i }).click();
      await page
        .getByRole("textbox", { name: /edit review/i })
        .fill("Updated review");
      await page.getByRole("radio", { name: /4 stars/i }).click();
      await page.getByRole("button", { name: /save/i }).click();

      // Verify changes
      await expect(page.getByText("Updated review")).toBeVisible();
      await expect(page.getByText(/4 stars/i)).toBeVisible();
      await expect(page.getByText(/edited/i)).toBeVisible();
    });

    test("user can delete their review", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Submit review
      await page
        .getByRole("textbox", { name: /write a review/i })
        .fill("Review to delete");
      await page.getByRole("radio", { name: /3 stars/i }).click();
      await page.getByRole("button", { name: /submit/i }).click();

      // Delete review
      await page.getByRole("button", { name: /delete review/i }).click();
      await page.getByRole("button", { name: /confirm delete/i }).click();

      // Verify deletion
      await expect(page.getByText("Review to delete")).not.toBeVisible();
      await expect(page.getByText(/review deleted/i)).toBeVisible();
    });

    test("user cannot edit other users' reviews", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Verify edit/delete buttons are not visible on other users' reviews
      const otherUserReview = page
        .getByTestId("review-item")
        .filter({ hasText: "other_user" });
      await expect(
        otherUserReview.getByRole("button", { name: /edit/i })
      ).not.toBeVisible();
      await expect(
        otherUserReview.getByRole("button", { name: /delete/i })
      ).not.toBeVisible();
    });
  });

  test.describe("Review Interactions", () => {
    test("user can like/unlike reviews", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      const review = page.getByTestId("review-item").first();
      const likeButton = review.getByRole("button", { name: /like/i });

      // Like review
      await likeButton.click();
      await expect(review.getByText(/1 like/i)).toBeVisible();
      await expect(likeButton).toHaveAttribute("aria-pressed", "true");

      // Unlike review
      await likeButton.click();
      await expect(review.getByText(/0 likes/i)).toBeVisible();
      await expect(likeButton).toHaveAttribute("aria-pressed", "false");
    });

    test("user can report inappropriate reviews", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Report review
      await page
        .getByRole("button", { name: /report/i })
        .first()
        .click();
      await page.getByRole("radio", { name: /inappropriate content/i }).click();
      await page
        .getByRole("textbox", { name: /additional details/i })
        .fill("Test report reason");
      await page.getByRole("button", { name: /submit report/i }).click();

      // Verify report submission
      await expect(page.getByText(/report submitted/i)).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("network error during review submission", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Simulate network error
      await page.route("**/api/reviews**", (route) => route.abort("failed"));

      // Attempt to submit review
      await page
        .getByRole("textbox", { name: /write a review/i })
        .fill("Test review");
      await page.getByRole("radio", { name: /5 stars/i }).click();
      await page.getByRole("button", { name: /submit/i }).click();

      // Verify error handling
      await expect(page.getByText(/network error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("server error during review submission", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Simulate server error
      await page.route("**/api/reviews**", (route) =>
        route.fulfill({
          status: 500,
          body: "Internal Server Error",
        })
      );

      // Attempt to submit review
      await page
        .getByRole("textbox", { name: /write a review/i })
        .fill("Test review");
      await page.getByRole("radio", { name: /5 stars/i }).click();
      await page.getByRole("button", { name: /submit/i }).click();

      // Verify error handling
      await expect(page.getByText(/server error/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /retry/i })).toBeVisible();
    });

    test("retry functionality", async ({ page }) => {
      await page.goto("http://localhost:3000/videos/test-video-1");

      // Simulate temporary failure
      await page.route("**/api/reviews**", (route) => route.abort("failed"), {
        times: 1,
      });

      // Attempt to submit review
      await page
        .getByRole("textbox", { name: /write a review/i })
        .fill("Test review");
      await page.getByRole("radio", { name: /5 stars/i }).click();
      await page.getByRole("button", { name: /submit/i }).click();

      // Verify error and retry
      await expect(page.getByText(/network error/i)).toBeVisible();
      await page.getByRole("button", { name: /retry/i }).click();

      // Verify successful retry
      await expect(page.getByText(/review submitted/i)).toBeVisible();
    });
  });
});

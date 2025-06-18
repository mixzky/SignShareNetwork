import { test, expect } from "@playwright/test";

test("can create, update, and delete a review in sequence", async ({
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
  await page.goto("http://localhost:3000/country/356");

  // --- Create Review ---
  await page.getByRole("button", { name: /upvote/i }).click();
  await page
    .getByPlaceholder("Share your thoughts...")
    .fill("This is a test review");
  await page.getByPlaceholder("Share your thoughts...").press("Enter");
  await expect(
    page.locator("div.p-4.bg-white p", { hasText: "This is a test review" })
  ).toBeVisible();

  // --- Update Review ---
  await page
    .getByPlaceholder("Share your thoughts...")
    .fill("This is an updated review");
  await page.getByRole("button", { name: /downvote/i }).click();
  await page.getByPlaceholder("Share your thoughts...").press("Enter");
  await expect(
    page.locator("div.p-4.bg-white p", { hasText: "This is an updated review" })
  ).toBeVisible();

  // --- Delete Review ---
  await page.getByRole("button", { name: /delete/i }).click();
  // Wait for the review to disappear from the list (not from the textarea)
  await expect(
    page.locator("div.p-4.bg-white p", { hasText: "This is an updated review" })
  ).not.toBeVisible();
});

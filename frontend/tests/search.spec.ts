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

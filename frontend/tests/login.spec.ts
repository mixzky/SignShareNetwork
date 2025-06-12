import { test, expect } from "@playwright/test";

test("user can register, login, and logout", async ({ page }) => {
  const email = `testuser_${Date.now()}@example.com`;
  const password = "password123";
  const username = `testuser_${Date.now()}`;

  // Go to the registration page
  await page.goto("http://localhost:3000/register");

  // Fill in registration form
  await page.getByPlaceholder("Username").fill(username);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);

  // Click the Sign up button
  await page.getByRole("button", { name: /sign up/i }).click();

  // Expect to be redirected to the homepage
  await expect(page).toHaveURL("http://localhost:3000/");

  // Open user menu (click avatar/profile button)
  await page.locator('div[role="button"], .rounded-full').first().click();
  // Wait for the sign out button to be visible
  await page.getByText(/sign out/i).waitFor({ state: "visible" });
  // Click sign out
  await page.getByText(/sign out/i).click();

  // Confirm still on homepage and Login button is visible in TopMenu
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("link", { name: /login/i })).toBeVisible();

  // Go to login page before logging in again
  await page.goto("http://localhost:3000/login");

  // Log in with the same credentials
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("http://localhost:3000/");

  // Open user menu again
  await page.locator('div[role="button"], .rounded-full').first().click();

  // Log out again
  await page.getByText(/sign out/i).waitFor({ state: "visible" });
  await page.getByText(/sign out/i).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
});

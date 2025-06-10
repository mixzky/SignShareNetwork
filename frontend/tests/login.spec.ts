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

  // Log out after registration
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/login/);

  // Log in with the same credentials
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("http://localhost:3000/");

  // Log out again
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/login/);
});

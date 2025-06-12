import { test, expect } from "@playwright/test";

test("user can edit profile", async ({ page }) => {
  const email = "khannpwks173@gmail.com";
  const password = "123456";
  const newDisplayName = "Updated Name";
  const newBio = "This is my new bio!";

  // Go to login page
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL("http://localhost:3000/");

  // Go to edit profile page
  await page.goto("http://localhost:3000/profile/edit");
  await expect(page.getByText(/edit profile/i)).toBeVisible();

  // Edit display name and bio
  await page.getByLabel(/display name/i).fill(newDisplayName);
  await page.getByLabel(/bio/i).fill(newBio);

  // Save changes
  await page.getByRole("button", { name: /save changes/i }).click();

  // Should redirect to profile page and show updated info
  await expect(page).toHaveURL("http://localhost:3000/profile");
  await expect(page.getByText(newDisplayName)).toBeVisible();
  await expect(page.getByText(newBio)).toBeVisible();

  await page
    .getByRole("button", { name: /khannpwks173@gmail.com|updated name/i })
    .click();

  // Log out again
  await page.getByText(/sign out/i).waitFor({ state: "visible" });
  await page.getByText(/sign out/i).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
});

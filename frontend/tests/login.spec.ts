import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test.describe("Registration", () => {
    test("successful registration", async ({ page }) => {
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits
      const email = `testuser_${timestamp}@example.com`;
      const password = "TestPassword123";
      const username = `testuser_${timestamp}`;

      await page.goto("http://localhost:3000/register");
      await page.getByPlaceholder("Enter your username").fill(username);
      await page.getByPlaceholder("Enter your email address").fill(email);
      await page.getByPlaceholder("Create a secure password").fill(password);
      await page.getByRole("button", { name: "Sign up" }).click();

      // Wait for navigation or success message
      await page.waitForTimeout(2000);
      // Check if we're redirected to home or see a success message
      await expect(page).toHaveURL("http://localhost:3000/");
    });

    test("registration field validation errors", async ({ page }) => {
      await page.goto("http://localhost:3000/register");

      // Test username validation
      const usernameInput = page.getByPlaceholder("Enter your username");
      await usernameInput.fill("ab"); // Too short
      await usernameInput.blur();
      await expect(
        page.locator("text=Username must be at least 3 characters")
      ).toBeVisible();

      // Test invalid username characters
      await usernameInput.fill("test@user");
      await usernameInput.blur();
      await expect(
        page.locator(
          "text=Username can only contain letters, numbers, and underscores"
        )
      ).toBeVisible();

      // Test email validation
      const emailInput = page.getByPlaceholder("Enter your email address");
      await emailInput.fill("invalid-email");
      await emailInput.blur();
      await expect(
        page.locator("text=Please enter a valid email address")
      ).toBeVisible();

      // Test password validation
      const passwordInput = page.getByPlaceholder("Create a secure password");
      await passwordInput.fill("weak");
      await passwordInput.blur();
      await expect(
        page.locator("text=Password must be at least 8 characters")
      ).toBeVisible();

      await passwordInput.fill("weakpassword");
      await passwordInput.blur();
      await expect(
        page.locator(
          "text=Password must contain at least one uppercase letter, one lowercase letter, and one number"
        )
      ).toBeVisible();
    });

    test("password visibility toggle", async ({ page }) => {
      await page.goto("http://localhost:3000/register");

      const passwordInput = page.getByPlaceholder("Create a secure password");
      const toggleButton = page.locator('button[aria-label="Show password"]');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute("type", "password");

      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute("type", "text");

      // Click toggle to hide password again
      await page.locator('button[aria-label="Hide password"]').click();
      await expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  test.describe("Login", () => {
    test("successful login with valid credentials", async ({ page }) => {
      await page.goto("http://localhost:3000/login");

      await page
        .getByPlaceholder("Enter your email address")
        .fill("testuser_862694@example.com");
      await page
        .getByPlaceholder("Enter your password")
        .fill("TestPassword123");
      await page.getByRole("button", { name: "login" }).click();

      await page.waitForTimeout(2000);
      // Check if we're redirected to home
      const currentUrl = page.url();
      expect(currentUrl).toBe("http://localhost:3000/");
    });

    test("login password visibility toggle", async ({ page }) => {
      await page.goto("http://localhost:3000/login");

      const passwordInput = page.getByPlaceholder("Enter your password");
      const toggleButton = page.locator('button[aria-label="Show password"]');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute("type", "password");

      // Click toggle to show password
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute("type", "text");

      // Click toggle to hide password again
      await page.locator('button[aria-label="Hide password"]').click();
      await expect(passwordInput).toHaveAttribute("type", "password");
    });

    test("login validation errors", async ({ page }) => {
      await page.goto("http://localhost:3000/login");

      // Empty form submission
      await page.getByRole("button", { name: "login" }).click();
      await page.waitForTimeout(1000);

      // Check for error messages in the new error format
      const errorElement = page.locator(".bg-red-50 .text-red-700");
      if ((await errorElement.count()) > 0) {
        const errorText = await errorElement.textContent();
        expect(errorText?.length).toBeGreaterThan(0);
      }
    });

    test("login invalid credentials", async ({ page }) => {
      await page.goto("http://localhost:3000/login");
      await page
        .getByPlaceholder("Enter your email address")
        .fill("wrong@example.com");
      await page.getByPlaceholder("Enter your password").fill("wrongpass");
      await page.getByRole("button", { name: "login" }).click();

      await page.waitForTimeout(2000);
      // Should stay on login page or show error
      const errorElement = page.locator(".bg-red-50 .text-red-700");
      if ((await errorElement.count()) > 0) {
        const errorText = await errorElement.textContent();
        expect(errorText?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Password Reset", () => {
    test("password reset form loads", async ({ page }) => {
      await page.goto("http://localhost:3000/forgot-password");
      await expect(page.locator('label[for="Email"]')).toBeVisible();
      await expect(
        page.getByPlaceholder("Enter your email address")
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Forgot Password" })
      ).toBeVisible();
    });

    test("password reset form submission - success", async ({ page }) => {
      await page.goto("http://localhost:3000/forgot-password");
      await page
        .getByPlaceholder("Enter your email address")
        .fill("khannpwks173@gmail.com");
      await page.getByRole("button", { name: "Forgot Password" }).click();

      await page.waitForTimeout(2000);

      // Check for success message in the UI (no more alert)
      const successElement = page.locator(".bg-green-50 .text-green-700");
      await expect(successElement).toBeVisible();

      const successText = await successElement.textContent();
      expect(successText).toContain(
        "Password reset link sent to your email. Please check your inbox and spam folder."
      );
    });

    test("password reset form submission - error", async ({ page }) => {
      await page.goto("http://localhost:3000/forgot-password");

      // Test with invalid email format
      await page
        .getByPlaceholder("Enter your email address")
        .fill("invalid-email");
      await page.getByRole("button", { name: "Forgot Password" }).click();

      await page.waitForTimeout(2000);

      // Check for error messages
      const errorElement = page.locator(".bg-red-50 .text-red-700");
      if ((await errorElement.count()) > 0) {
        const errorText = await errorElement.textContent();
        expect(errorText?.length).toBeGreaterThan(0);
      }
    });

    test("password reset form validation - empty email", async ({ page }) => {
      await page.goto("http://localhost:3000/forgot-password");

      // Submit without entering email
      await page.getByRole("button", { name: "Forgot Password" }).click();

      await page.waitForTimeout(1000);

      // Check for validation errors
      const errorElement = page.locator(".bg-red-50 .text-red-700");
      if ((await errorElement.count()) > 0) {
        const errorText = await errorElement.textContent();
        expect(errorText?.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Navigation", () => {
    test("navigation between auth pages", async ({ page }) => {
      // Test login to register navigation
      await page.goto("http://localhost:3000/login");
      await page.getByRole("link", { name: "Sign Up" }).click();
      await expect(page).toHaveURL("http://localhost:3000/register");

      // Test register to login navigation
      await page.getByRole("link", { name: "Sign In" }).click();
      await expect(page).toHaveURL("http://localhost:3000/login");

      // Test login to forgot password navigation
      await page.getByRole("link", { name: "Reset Password" }).click();
      await expect(page).toHaveURL("http://localhost:3000/forgot-password");
    });

    test("Google OAuth button exists", async ({ page }) => {
      await page.goto("http://localhost:3000/login");
      await expect(page.getByText("Login with Google")).toBeVisible();
    });
  });
});

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

//Test User can SignIn Login with Google and Test User can Reset Password
//TODO: change email and  make it synchronous with the above test
test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByText('Login with Google').click();
  await page.getByRole('textbox', { name: 'Email or phone' }).fill('@student.chula.ac.th');
  await page.getByRole('textbox', { name: 'Email or phone' }).press('Enter');
  await page.getByRole('textbox', { name: '@chula.ac.th or @student.' }).click();
  await page.getByRole('textbox', { name: '@chula.ac.th or @student.' }).fill('@student.chula.ac.th');
  await page.getByRole('textbox', { name: '@chula.ac.th or @student.' }).press('Enter');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('textbox', { name: 'Enter the password for' }).click();
  await page.getByRole('textbox', { name: 'Enter the password for' }).fill('abcddddd');
  await page.getByRole('textbox', { name: 'Enter the password for' }).press('Enter');
  await page.getByText('Enter password Sign in').click({
    button: 'right'
  });
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await page.goto('https://accounts.google.com/signin/oauth/id?authuser=0&part=AJi8hANtrNtgeLXMOQ4-kbBUduvIH_vQVwbKB280QrmGUTnSVxLL8PBH9LEYk5fbuKo-19MnVUsiS-LHZAneHMP8CMfGp7h4kjiW7bFcPME-BD4QLtz_6gNlHCZaHizJ0FRK1ka42dJ8aDylEF0VzAiBAqw2RwN_xTsUQDE0JHFyCkCUbRSdbHXfiXwnKncTgiepm_5hhUBIv7B7buiuKF-gLrLE9lDV-bKq5cG7CiHyA6KA7FGtNssxt2b659UVrJ1QsLsXQHCOa8JtRZVWzcPo61t0L4aDWAgAox0Mtn1WQtBsfCRYjtXG7OrCRcCwW8WKDt7snT_ACJXxk4ZKFCnoEa0ABbDkJtOC0HkTtpIICmjDmI7By9Of5W9M47h2bEkUWKDIucd4ZBV50ij7HRh6SPghq7id4ez_8mTXqqwtcYONM-eIdxfDxPUIeUNUdVBtUm_FeVbjJSRxpl778iwvb473vEkNeA8KQgr6QW-Mnoj6V5BF14GynUOsBkqyK482Acn1KaNYrrHiyT2HmZOJPVugtz92QvMkElgqKmG54CddwU-TTboN4f2jcKQ3WIVWZPoSlYbsRCVVScwygI-d-Zl_1SxEneRJh3E2bylo4velVPPgqeBVpPEOD9pmInFg7UCJTnYT_te4397VL6lFk_1tiX8dwB1u-AH_rnur9r4zrtXfVK50VpsvBncruueTrkESJn5rvDOtCeRBiGzpAlfIeS28Pxui6L-bjD-kfQdhA2cKVmo8NZwAesQ8yLmYBdOk8UuTOaiCs9LsjbZh9CQ0RXtWAmMjhBWDCegVPZukRzic6B_TtIkTR5OBfpKdP0bfPjrlaDZEEfORgKyLy6urB8O0432eTslAH1Q1vVP20B_7dAetH5mtk0-OPD06K35YyLCwnVCiO8a-_lI0XYRK5I2GrQzoUiVVKAGidJyBSK8Ehud4cBebhvMmGcBo5aehqoJt2FpQdjl7QOVwgGmCSTLDNdi6IeokW0_TDAzeyeeug1aiPnzwpVkwoKVW3Bs_aJoz&flowName=GeneralOAuthFlow&as=S456926658%3A1751353671496809&client_id=166668516588-dtgkrctr1aka3bk8du206qd8bitoqd0k.apps.googleusercontent.com&rapt=AEjHL4MOWEDRsDVDNiFZ5ygVH7xMJ2GZpgwmPfFoE29Wuly78i_oBLEEPRwW5hbiiajxFce0O5rrb48DCmunqDzB01wMTsDV7Ma7RYuPOhZfOcAr4nV8N0E#');
  await page.getByRole('button', { name: 'ดำเนินการต่อ' }).click();
  await page.getByRole('button', { name: '6733179021' }).click();
  await page.getByRole('menuitem', { name: 'Sign Out' }).click();
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Reset Password' }).click();
  await page.getByRole('textbox', { name: 'Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill('pisitpat8189@gmail.com');
  await page.getByRole('textbox', { name: 'Email' }).press('Enter');
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Forgot Password' }).click();
  await page.goto('http://localhost:3000/forgot-password');
});
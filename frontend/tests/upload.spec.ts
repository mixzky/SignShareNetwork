import { test, expect } from "@playwright/test";

//TODO: implemenet more advance user flwo
test("upload video", async ({
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
  await page.goto("http://localhost:3000/country/764");
  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByRole('button', { name: 'Upload Your Video' }).click();
  await page.locator('div').filter({ hasText: /^Drag & drop or click to select a video file$/ }).click();
  await page.getByRole('dialog', { name: 'Upload Sign Language Video' }).setInputFiles('Download (5).mp4');
  await page.getByRole('textbox', { name: 'Title' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('abcd');
  await page.getByRole('textbox', { name: 'Description' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill('hello test test');
  await page.getByRole('textbox', { name: 'Language' }).click();
  await page.getByRole('textbox', { name: 'Language' }).fill('Thai');
  await page.getByRole('textbox', { name: 'Region' }).click();
  await page.getByRole('textbox', { name: 'Region' }).fill('Thailand');
  await page.getByRole('button', { name: 'Upload Video' }).click();
  await page.goto('http://localhost:3000/country/764');
  await page.getByText('Video uploaded successfully').click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('heading', { name: 'abcd' }).click();
  await page.getByRole('textbox', { name: 'Enter video title' }).click();
  await page.getByRole('textbox', { name: 'Enter video description' }).click();
  await page.getByText('Tags', { exact: true }).click();
  
});



  
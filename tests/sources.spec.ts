import { test, expect } from "@playwright/test"

test("a parent who arrives from Google Maps sees where they came from and can set contact preferences", async ({ page }) => {
  await page.goto("/#from/maps")
  await page.getByLabel("Email address").fill("parent@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByText(/Google Maps/).first()).toBeVisible()
  await page.getByRole("button", { name: /^Messages/ }).click()
  await page.getByLabel("Text messages").uncheck()
  await expect(page.getByLabel("Text messages")).not.toBeChecked()
})

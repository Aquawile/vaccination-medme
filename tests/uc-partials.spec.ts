import { test, expect, type Page } from "@playwright/test"

async function parent(page: Page, hash = "") {
  await page.goto(`/${hash}`)
  await page.getByLabel("Email address").fill("parent@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
}

test("sign in with an emailed code (demo) and a wrong code is refused", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Email address").fill("parent@example.test")
  await page.getByRole("button", { name: "Email me a sign-in code instead" }).click()
  await page.getByLabel("6-digit code").fill("000000")
  await page.getByRole("button", { name: "Verify and continue" }).click()
  await expect(page.getByText(/code is not right/)).toBeVisible()
  await page.getByLabel("6-digit code").fill("482913")
  await page.getByRole("button", { name: "Verify and continue" }).click()
  await expect(page.getByRole("button", { name: /School notice/ })).toBeVisible()
})

test("link carries the school id, and the school's list is checked on the first screen", async ({ page }) => {
  await parent(page, "#from/school/cedar-grove-elementary")
  await expect(page.getByText(/This link is for Cedar Grove Elementary/)).toBeVisible()
  await expect(page.getByRole("status").filter({ hasText: /school's list/ }).first()).toBeVisible()
})

test("booking shows other routes and where the state's own rules are; nothing is preselected", async ({ page }) => {
  await parent(page)
  await page.getByRole("button", { name: "Review child details", exact: true }).click()
  await page.getByRole("button", { name: "Save and continue" }).click()
  await expect(page.getByRole("checkbox", { name: /^DTaP/ })).not.toBeChecked()
  await page.getByText("Add a manual record for review", { exact: true }).click()
  await expect(page.getByText(/MedMe does not summarize them/).first()).toBeVisible()
  await expect(page.getByText(/School lists: Dose 5 of DTaP/)).toBeVisible()
})

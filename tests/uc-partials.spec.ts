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

test("a session ends after 30 minutes without activity", async ({ page }) => {
  await page.clock.install()
  await parent(page)
  await expect(page.getByRole("button", { name: /School notice/ })).toBeVisible()
  await page.clock.fastForward("31:00")
  await expect(page.getByText("You were signed out after 30 minutes of inactivity.")).toBeVisible()
})

test("a pharmacy publishes what it offers and warns when it changes the sample", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Email address").fill("pharmacist@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.getByRole("tab", { name: "Settings" }).click()
  await page.getByLabel("Oldest age").fill("12")
  await expect(page.getByText(/Check your state's own page before you publish/)).toBeVisible()
  await page.getByRole("button", { name: "Publish", exact: true }).click()
  await expect(page.getByText(/Families now see/)).toBeVisible()
  await expect(page.getByRole("tab", { name: "Schedule" })).toBeVisible()
})

test("pharmacist works the day: check in, no-show, message, calendar, custom message", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Email address").fill("pharmacist@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByRole("tab", { name: "Schedule" })).toBeVisible()
  await expect(page.getByRole("tab", { name: "Today" })).toHaveCount(0)
  await page.getByRole("gridcell", { name: /^Sep 11/ }).click()
  const rows = page.locator(".visit-table tbody tr")
  await expect(rows.first()).toBeVisible()
  await rows.nth(0).getByRole("button", { name: "Check in" }).click()
  await expect(rows.nth(0).getByText("Checked in")).toBeVisible()
  await rows.nth(1).getByRole("button", { name: "No-show" }).click()
  await rows.nth(1).getByRole("button", { name: "Message family" }).click()
  await expect(page.getByLabel("Template")).toHaveValue("noshow")
  await page.getByLabel(/I reviewed this message/).check()
  await page.getByRole("button", { name: /^Send to 1 families/ }).click()
  await expect(page.getByText(/Simulated: nothing was delivered/)).toBeVisible()
  await page.getByLabel("Template").selectOption("custom")
  await page.getByRole("button", { name: "{vaccines}" }).click()
  await expect(page.getByRole("textbox", { name: "Message" })).toHaveValue("{vaccines}")
  await page.getByRole("tab", { name: "Schedule" }).click()
  await expect(page.getByRole("button", { name: "Month", exact: true })).toBeVisible()
})

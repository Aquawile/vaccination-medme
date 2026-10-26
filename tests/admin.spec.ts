import { test, expect } from "@playwright/test"

test("administrator finds a student, contacts families and downloads documents", async ({ page }) => {
  await page.goto("/")
  await page.getByLabel("Email address").fill("admin@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Campaign overview" })).toBeVisible()
  await expect(page.getByText(/of 300 students have every required vaccine/)).toBeVisible()

  // find a student from the header search
  await page.getByLabel("Find a student").fill("st-002")
  await page.getByRole("option").first().click()
  await expect(page.getByRole("button", { name: /Download record/ })).toBeVisible()
  const [record] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Download record/ }).click(),
  ])
  expect(record.suggestedFilename()).toContain("immunization-record-demo.pdf")
  await page.getByRole("button", { name: "Back to students" }).click()

  // work a queue and contact families
  await page.getByRole("button", { name: "Missing doses, no visit" }).click()
  await page.getByLabel("Select all on this page").check()
  await expect(page.getByText("25 selected")).toBeVisible()
  await page.getByRole("button", { name: "Contact families", exact: true }).click()
  await expect(page.getByText("Template, edited by a person")).toBeVisible()
  await page.getByLabel(/I reviewed this message/).check()
  await page.getByRole("button", { name: /^Send to 25 families/ }).click()
  await expect(page.getByText(/Simulated: nothing was emailed/)).toBeVisible()
  // notice tracking lists the families just contacted
  await expect(page.getByRole("heading", { name: "Notice tracking" })).toBeVisible()
  await expect(page.getByText("25 families", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Mark replied" }).first().click()
  await expect(page.getByRole("button", { name: "Undo reply" })).toBeVisible()

  // reports: pick a category, download counts and the list
  await page.getByRole("tab", { name: "Reports" }).click()
  await page.getByRole("tab", { name: /Nonmedical exemption/ }).click()
  await expect(page.getByRole("tab", { name: /Nonmedical exemption/ })).toHaveAttribute("aria-selected", "true")
  const [counts] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Counts \(CSV\)/ }).click(),
  ])
  expect(counts.suggestedFilename()).toContain("csv")
  await page.getByRole("tab", { name: "Documents" }).click()
  const [report] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /School summary/ }).click(),
  ])
  expect(report.suggestedFilename()).toContain("compliance")

  // calendar
  await page.getByRole("tab", { name: "Calendar" }).click()
  await expect(page.getByRole("heading", { name: /September 2026/ })).toBeVisible()
  await page.getByRole("button", { name: "Next month" }).click()
  await expect(page.getByRole("heading", { name: /October 2026/ })).toBeVisible()

  // settings: school state is one setting, with an official link and a confirm step
  await page.getByRole("tab", { name: "Settings" }).click()
  await expect(page.getByRole("link", { name: /Oregon|OHA|Health Authority/i }).first()).toBeVisible()
  await page.getByLabel("State this school is in").selectOption("ID")
  await expect(page.getByRole("button", { name: /Change state to/ })).toBeDisabled()
  await page.getByLabel(/I understand/).check()
  await page.getByRole("button", { name: /Change state to/ }).click()
  await expect(page.getByText(/No official page on file/)).toBeVisible()
})

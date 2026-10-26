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

  // calendar: month and week views, mock items show, day panel lists them
  await page.getByRole("tab", { name: "Calendar" }).click()
  await expect(page.getByRole("heading", { name: /September 2026/ })).toBeVisible()
  await page.getByRole("gridcell", { name: /Sep 22, 2026/ }).click()
  await expect(page.getByLabel("Selected day").getByText("Second notice: missing doses")).toBeVisible()
  await page.getByRole("button", { name: "Week", exact: true }).click()
  await expect(page.getByRole("button", { name: "Month", exact: true })).toHaveAttribute("aria-pressed", "false")
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await page.getByRole("button", { name: "Month", exact: true }).click()
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await expect(page.getByRole("heading", { name: /October 2026|November 2026/ })).toBeVisible()

  // settings: official links only; the state change needs a reason, the school's name and the password
  await page.getByRole("tab", { name: "Settings" }).click()
  await expect(page.getByRole("link", { name: /Oregon Health Authority/ })).toBeVisible()
  await page.getByRole("button", { name: "Change state" }).click()
  await page.getByLabel("New state").selectOption("ID")
  await page.getByLabel("Reason").selectOption({ index: 1 })
  await page.getByLabel(/I understand/).check()
  await page.getByLabel("Type the school's name").fill("Cedar Grove Elementary")
  await page.getByLabel("Your password").fill("wrong")
  await page.getByRole("button", { name: "Confirm change" }).click()
  await expect(page.getByText("That password is not right.")).toBeVisible()
  await page.getByLabel("Your password").fill("Demo123!")
  await page.getByRole("button", { name: "Confirm change" }).click()
  await expect(page.getByText(/No official link on file/)).toBeVisible()
  await expect(page.getByText(/Pending MedMe verification/)).toBeVisible()
})

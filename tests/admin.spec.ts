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

  // reports downloads
  await page.getByRole("tab", { name: "Reports" }).click()
  await expect(page.getByRole("heading", { name: "Students by category" })).toBeVisible()
  await expect(page.getByRole("cell", { name: "Nonmedical exemption" }).first()).toBeVisible()
  await expect(page.getByRole("heading", { name: "Report worksheet" })).toBeVisible()
  const [csv] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Worksheet (CSV)" }).click(),
  ])
  expect(csv.suggestedFilename()).toContain("report-worksheet-OR")
  await page.getByLabel("State", { exact: true }).last().selectOption("CA")
  await expect(page.getByText(/No students from California/)).toBeVisible()
  await expect(page.getByText(/Over 10% of students conditional or overdue.*under the line/)).toBeVisible()
  const [report] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Compliance report, all students/ }).click(),
  ])
  expect(report.suggestedFilename()).toContain("compliance-report")

  // settings: a rule cannot be marked verified without a source link and date
  await page.getByRole("tab", { name: "Settings" }).click()
  await page.getByLabel("Status", { exact: true }).selectOption("read-on-official-page")
  await page.getByLabel("Source link").fill("")
  await page.getByLabel("Reviewer date").fill("")
  await page.getByRole("button", { name: "Save review" }).click()
  await expect(page.getByText(/source link starting with https/)).toBeVisible()
  await page.getByLabel("Source link").fill("https://health.example.test/rules")
  await page.getByLabel("Reviewer date").fill("2026-09-01")
  await page.getByRole("button", { name: "Save review" }).click()
  await expect(page.getByText(/Saved. The change is in the log/)).toBeVisible()

  // drives: a closed day is declined, an open day is accepted
  await page.getByRole("tab", { name: "Drives" }).click()
  await page.getByLabel("Partner pharmacy").selectOption({ label: "Oak Street Pharmacy" })
  await page.getByLabel("Date").fill("2026-09-12") // a Saturday
  await page.getByRole("button", { name: "Send request" }).click()
  await expect(page.getByText("Pharmacy declined")).toBeVisible()
  await page.getByLabel("Partner pharmacy").selectOption({ label: "Willow & Pine Pharmacy" })
  await page.getByLabel("Date").fill("2026-09-15")
  await page.getByRole("button", { name: "Send request" }).click()
  await expect(page.getByText("Pharmacy accepted")).toBeVisible()
  await expect(page.getByText(/QR code/).first()).toBeVisible()
})

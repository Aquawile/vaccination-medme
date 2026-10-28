import { test, expect, type Page } from "@playwright/test"
async function login(page: Page, role: string) {
  await page.getByLabel("Email address").fill(`${role}@example.test`)
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
}
async function logout(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click()
}
async function requirements(page: Page) {
  await page
    .getByRole("button", { name: "Review child details", exact: true })
    .click()
  await page.getByRole("button", { name: "Save and continue" }).click()
  await page.getByRole("checkbox", { name: /^DTaP/ }).check()
  await page.getByRole("checkbox", { name: /^IPV/ }).check()
  await page.getByRole("button", { name: "Save selection" }).click()
  await page.getByRole("button", { name: "Find a location and time" }).click()
}
async function locationAndTime(page: Page) {
  await page
    .getByRole("button", { name: "Choose this location" })
    .first()
    .click()
  await page.getByRole("button", { name: /Avery Morgan/ }).click()
  await page.locator(".date-options button").first().click()
  await page.getByRole("button", { name: "09:00", exact: true }).click()
  await page.getByRole("button", { name: "Continue to cost" }).click()
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
}
test("connected booking, clinician doses, PDF, reporting, sharing and school outcome", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/")
  await login(page, "parent")
  await requirements(page)
  await locationAndTime(page)
  await page.getByRole("button", { name: "Confirm sample cost" }).click()
  await expect(page.getByText("Confirmed total: $48.00")).toBeVisible()
  await page
    .getByRole("button", { name: "Review appointment", exact: true })
    .click()
  await noOverflow(page)
  await page.screenshot({
    path: info.outputPath("parent-review.png"),
    fullPage: true,
  })
  await page.getByLabel("Guardian’s full name").fill("Taylor Parker")
  await page.getByRole("checkbox", { name: /I am the child/ }).check()
  await page.getByRole("button", { name: "Confirm demo booking" }).click()
  await expect(
    page.getByRole("heading", { name: "Your appointments", exact: true }),
  ).toBeVisible()
  // reschedule moves the visit and frees the old time
  await page.getByRole("button", { name: "Change date or time" }).click()
  await page.getByLabel("New time").selectOption("15:30")
  await page.getByRole("button", { name: "Save new time" }).click()
  await expect(page.getByText(/15:30/).first()).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("school-demo-data-v1")!,
          ).appointments.filter((a: { seeded: boolean }) => !a.seeded).length,
      ),
    )
    .toBe(1)
  await logout(page)
  await login(page, "pharmacist")
  await page.getByRole("tab", { name: "Visits" }).click()
  await expect(
    page.getByText("APPOINTMENT · APT-", { exact: false }),
  ).toBeVisible()
  for (const label of [
    "Identity and record reviewed",
    "Consent verified with guardian",
    "Clinical suitability and prescription reviewed",
    "Cost reviewed with guardian",
  ])
    await page.getByRole("checkbox", { name: label }).check()
  for (const lot of ["DEMO-A123", "DEMO-B456"]) {
    await page.getByLabel("Lot number").fill(lot)
    await page.getByLabel("Administration site").selectOption("Left deltoid")
    await page.getByLabel("Signing clinician’s full name").fill("Avery Morgan")
    await page.getByRole("button", { name: "Sign and save dose" }).click()
  }
  await expect(
    page.getByText("All selected dose entries are saved.", { exact: false }),
  ).toBeVisible()
  await noOverflow(page)
  await page.screenshot({
    path: info.outputPath("pharmacist-complete.png"),
    fullPage: true,
  })
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download demo PDF" }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/demo-proof\.pdf$/)
  const path = await file.path()
  const fs = await import("node:fs/promises")
  const pdf = await fs.readFile(path!, "utf8")
  expect(pdf).toContain("%PDF-1.4")
  expect(pdf).toContain("DEMO-A123")
  expect(pdf).toContain("DEMO-B456")
  await page
    .getByRole("button", { name: "Simulate registry submission" })
    .click()
  await expect(
    page.getByText("2 of 2 saved doses acknowledged in simulation."),
  ).toBeVisible()
  await logout(page)
  await login(page, "parent")
  await page.getByRole("button", { name: /^Your appointments/ }).click()
  await page.getByRole("button", { name: "Remind me" }).first().click()
  await expect(page.getByRole("button", { name: "Reminder set" })).toBeVisible()
  await page.getByRole("button", { name: "Share demo summary" }).click()
  await expect(
    page.getByText("Demo summary copied to clipboard.", { exact: false }),
  ).toBeVisible()
  await page.getByRole("button", { name: /^Messages/ }).click()
  await expect(page.getByText("Visit confirmed")).toBeVisible()
  await page.getByRole("button", { name: "Mark received" }).click()
  await expect(page.getByText("Received", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Records", exact: true }).click()
  await expect(page.getByRole("heading", { name: "History" })).toBeVisible()
  await logout(page)
  await login(page, "admin")
  await expect(
    page.getByRole("heading", { name: "Campaign overview" }),
  ).toBeVisible()
  await noOverflow(page)
  await page.screenshot({
    path: info.outputPath("administrator.png"),
    fullPage: true,
  })
  await page.reload()
  const result = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("school-demo-data-v1")!),
  )
  expect(
    result.appointments.find((a: { seeded: boolean }) => !a.seeded).doses,
  ).toHaveLength(2)
  expect(
    result.events.filter((e: { type: string }) => e.type === "booking"),
  ).toHaveLength(1)
  expect(errors).toEqual([])
})
test("unknown cost blocks booking, unavailable records are distinct, cancellation retains history", async ({
  page,
}) => {
  await page.goto("/")
  await login(page, "admin")
  await page.evaluate(() => {
    window.location.hash = "dev"
  })
  await page.getByLabel("Registry lookup").selectOption("unavailable")
  await page
    .getByLabel("Registry reporting", { exact: true })
    .selectOption("failure")
  await logout(page)
  await login(page, "parent")
  await page
    .getByRole("button", { name: "Review child details", exact: true })
    .click()
  await page.getByRole("button", { name: "Save and continue" }).click()
  await page
    .getByRole("button", { name: "Retrieve sample registry record" })
    .click()
  await expect(
    page.getByText("Record unavailable", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("This does not mean your child has received no vaccines.", {
      exact: false,
    }),
  ).toBeVisible()
  await page.getByRole("checkbox", { name: /^DTaP/ }).check()
  await page.getByRole("button", { name: "Save selection" }).click()
  await page.getByRole("button", { name: "Find a location and time" }).click()
  await locationAndTime(page)
  await page.getByRole("button", { name: /Sample insurance/ }).click()
  await page.getByLabel("Fictional insurance response").selectOption("unknown")
  await page.getByRole("button", { name: "Confirm sample cost" }).click()
  await expect(page.getByText("Cost unknown", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Review appointment", exact: true }),
  ).toBeDisabled()
  await page.getByRole("button", { name: /Self-pay/ }).click()
  await page.getByRole("button", { name: "Confirm sample cost" }).click()
  await page
    .getByRole("button", { name: "Review appointment", exact: true })
    .click()
  await page.getByLabel("Guardian’s full name").fill("Taylor Parker")
  await page.getByRole("checkbox", { name: /I am the child/ }).check()
  await page.getByRole("button", { name: "Confirm demo booking" }).click()
  await page
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click()
  await page.getByRole("button", { name: "Confirm cancellation" }).click()
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole("button", { name: /^Your appointments/ }).click()
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible()
})

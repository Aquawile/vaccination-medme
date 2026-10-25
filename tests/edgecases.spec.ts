import { test, expect } from "@playwright/test"
import { initialData } from "../src/demo/config"
import { journeyDefaults, emptyDraft, reviewItems } from "../src/demo/journey"
import { createBooking, quoteCost, saveDose } from "../src/demo/services"
test("keyboard access, reduced motion and palette contrast", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.keyboard.press("Tab")
  await expect(page.getByLabel("Email address")).toBeFocused()
  expect(
    await page
      .getByLabel("Email address")
      .evaluate((e) => getComputedStyle(e).outlineStyle),
  ).toBe("solid")
  await page.keyboard.type("parent@example.test")
  await page.keyboard.press("Tab")
  await page.keyboard.type("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).focus()
  expect(
    await page
      .getByRole("button", { name: "Sign in", exact: true })
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s")
  await page.keyboard.press("Enter")
  await expect(
    page.getByRole("heading", { name: "Your school notice" }),
  ).toBeFocused()
  const contrast = await page.evaluate(() => {
    const luminance = (hex: string) => {
      const value = hex.replace("#", "")
      const channels = (
        value.length === 3
          ? value
              .split("")
              .map((c) => c + c)
              .join("")
          : value
      )
        .match(/.{2}/g)!
        .map((v) => parseInt(v, 16) / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
    }
    const style = getComputedStyle(document.documentElement)
    const ratio = (a: string, b: string) => {
      const x = luminance(a),
        y = luminance(b)
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
    }
    const token = (name: string) => style.getPropertyValue(name).trim()
    return [
      ...["--canvas", "--blush", "--lavender", "--periwinkle"].map((name) =>
        ratio(token("--navy"), token(name)),
      ),
      ratio(token("--text-secondary"), token("--white")),
      ratio(token("--success"), token("--success-soft")),
      ratio(token("--error"), token("--error-soft")),
    ]
  })
  for (const ratio of contrast) expect(ratio).toBeGreaterThanOrEqual(4.5)
})
test("service guards enforce unknown-cost blocking and idempotent dose saving", async () => {
  let data = structuredClone({ ...initialData, ...journeyDefaults })
  data.childSaved = true
  data.selection = ["dtap", "polio"]
  const draft = {
    ...emptyDraft,
    locationId: "willow",
    providerId: "avery",
    date: "2026-09-09",
    time: "09:00",
    guardian: "Taylor Parker",
    consent: true,
  }
  expect(
    quoteCost(
      { ...draft, payment: "insurance", plan: "covered" },
      data.selection,
    ),
  ).toBe(0)
  expect(
    createBooking(data, {
      ...draft,
      payment: "insurance",
      plan: "covered",
    }).appointments.slice(-1)[0]?.cost,
  ).toBe(0)
  expect(
    quoteCost(
      { ...draft, payment: "insurance", plan: "unknown" },
      data.selection,
    ),
  ).toBeNull()
  expect(() =>
    createBooking(data, { ...draft, payment: "insurance", plan: "unknown" }),
  ).toThrow(/confirmed price/)
  expect(() => createBooking(data, { ...draft, consent: false })).toThrow(
    /consent/,
  )
  data = createBooking(data, draft)
  expect(() => createBooking(data, draft)).toThrow(/just booked/)
  const appointment = data.appointments.find((a) => !a.seeded)!
  const dose = {
    id: `${appointment.id}-dtap`,
    vaccine: "dtap",
    lot: "DEMO-LOT",
    site: "Left deltoid",
    time: "09:05",
    date: appointment.date,
    signature: "Avery Morgan",
    reported: false,
  }
  expect(() => saveDose(data, appointment.id, dose)).toThrow(/review/)
  appointment.reviews = [...reviewItems]
  data = saveDose(data, appointment.id, dose)
  const again = saveDose(data, appointment.id, dose)
  expect(again).toBe(data)
  expect(
    again.appointments.find((a) => a.id === appointment.id)?.doses,
  ).toHaveLength(1)
  expect(
    again.appointments.find((a) => a.id === appointment.id)?.proofShared,
  ).toBe(false)
})
test("registration validation, manual/photo records and editable sample rules", async ({
  page,
}) => {
  await page.goto("/")
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click()
  await page.getByLabel("Email address").fill("parent@example.test")
  await page.getByLabel("Create a demo password").fill("CustomDemo1!")
  await page.getByLabel("Confirm password").fill("not-the-same")
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click()
  await expect(page.getByText("Passwords do not match.")).toBeVisible()
  await page.getByLabel("Confirm password").fill("CustomDemo1!")
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Review child details", exact: true })
    .click()
  await page.getByLabel("Child’s full name").fill("")
  await page.getByRole("button", { name: "Save and continue" }).click()
  await expect(page.getByText("Enter your child’s name.")).toBeVisible()
  await page.getByLabel("Child’s full name").fill("Sam Parker")
  await page.getByRole("button", { name: "Save and continue" }).click()
  await page
    .getByText("Add a manual record for review", { exact: true })
    .click()
  await page.getByLabel("Date listed on record").fill("2023-04-15")
  await page
    .getByLabel("Record source or notes")
    .fill("Fictional Cedar Glen clinic")
  await page.getByRole("button", { name: "Save manual record" }).click()
  await expect(
    page.getByText("Record awaiting review", { exact: true }),
  ).toBeVisible()
  await page.getByText("Attach a record photo", { exact: true }).click()
  await page.getByLabel("Record image").setInputFiles({
    name: "sample-record.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71]),
  })
  await expect(
    page.getByText("Photo filename saved locally.", { exact: false }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Sign out" }).click()
  await page.getByLabel("Email address").fill("admin@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.getByRole("tab", { name: "Rules" }).click()
  await page.getByLabel("DTaP requirement").fill("")
  await page.getByRole("button", { name: "Save rules" }).click()
  await expect(page.getByText("Required", { exact: true })).toBeVisible()
  await page
    .getByLabel("DTaP requirement")
    .fill("Sample: review 5 documented doses")
  await page.getByRole("button", { name: "Save rules" }).click()
  await expect(
    page.getByText("Sample rules saved on this device."),
  ).toBeVisible()
  await page.evaluate(() => {
    window.location.hash = "dev"
  })
  await page.getByLabel("Parent record scenario").selectOption("complete")
  await page.getByRole("button", { name: "Sign out" }).click()
  await page.getByLabel("Email address").fill("parent@example.test")
  await page.getByLabel("Password", { exact: true }).fill("CustomDemo1!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page
    .getByRole("button", { name: "Child & requirements", exact: true })
    .click()
  await expect(
    page.getByText("Requirements complete", { exact: true }),
  ).toBeVisible()
  await expect(page.getByRole("checkbox", { name: /^DTaP/ })).toHaveCount(0)
})
test("reporting failure exports without reporting; referral retains saved doses", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByLabel("Email address").fill("admin@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.evaluate(() => {
    window.location.hash = "dev"
  })
  await page
    .getByLabel("Registry reporting", { exact: true })
    .selectOption("failure")
  await page.getByRole("button", { name: "Sign out" }).click()
  await page.getByLabel("Email address").fill("pharmacist@example.test")
  await page.getByLabel("Password", { exact: true }).fill("Demo123!")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  for (const item of reviewItems)
    await page.getByRole("checkbox", { name: item }).check()
  await page.getByLabel("Lot number").fill("SAMPLE-FAILURE")
  await page.getByLabel("Administration site").selectOption("Right deltoid")
  await page.getByLabel("Signing clinician’s full name").fill("Jordan Ellis")
  await page.getByRole("button", { name: "Sign and save dose" }).click()
  await page
    .getByRole("button", { name: "Simulate registry submission" })
    .click()
  await expect(
    page.getByText("Simulated reporting failed.", { exact: false }),
  ).toBeVisible()
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download manual export" }).click()
  expect((await download).suggestedFilename()).toMatch(/registry-export\.csv$/)
  await expect(
    page.getByText("0 of 1 saved doses acknowledged in simulation."),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Decline or refer", exact: true })
    .click()
  await page
    .getByLabel("Reason", { exact: true })
    .selectOption("Clinical concern — refer to physician")
  await page.getByRole("button", { name: "Save decision" }).click()
  await expect(
    page.getByText(
      "Declined / referred: Clinical concern — refer to physician",
      { exact: true },
    ),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Sign and save dose" }),
  ).toHaveCount(0)
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("school-demo-data-v1")!),
  )
  expect(data.appointments[0].doses).toHaveLength(1)
  expect(data.appointments[0].doses[0].reported).toBe(false)
})

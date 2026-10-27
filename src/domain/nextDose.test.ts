import { describe, expect, it } from "vitest"
import { nextDoseDate } from "./nextDose"
describe("nextDoseDate", () => {
  it("adds the table interval", () => expect(nextDoseDate("dtap", "2026-09-10")).toBe("2026-10-08"))
  it("returns null when there is no interval on file", () => expect(nextDoseDate("mmr", "2026-09-10")).toBeNull())
  it("crosses a year end", () => expect(nextDoseDate("polio", "2026-12-20")).toBe("2027-01-17"))
})

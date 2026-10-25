import { describe, expect, it } from "vitest"
import { ageAt, addDays, nextWeekdays } from "./dates"
import { checkEligibility, type Store } from "./eligibility"
import { getChildStatus, getMissingShots } from "./missingShots"
import { allIntervals, allRequirements, allStateRules } from "./rules.data"
import { getStateRule } from "./stateRules"
import type { Student } from "./types"

const today = "2026-09-08"
const kid = (over: Partial<Student> = {}): Student => ({
  id: "s1", name: "Test Child", birthDate: "2019-04-15", grade: "2",
  school: "Test School", state: "OR", doses: [], ...over,
})
const dose = (vaccineId: string, date: string) => ({ vaccineId, date, source: "parent" as const })

describe("dates", () => {
  it("age on the exact birthday counts the new year", () => {
    expect(ageAt("2019-09-08", today)).toBe(7)
    expect(ageAt("2019-09-09", today)).toBe(6)
  })
  it("adds days across month ends", () => expect(addDays("2026-01-30", 3)).toBe("2026-02-02"))
  it("skips weekends", () => {
    expect(nextWeekdays("2026-09-11", 3)).toEqual(["2026-09-14", "2026-09-15", "2026-09-16"])
  })
})

describe("missing shots", () => {
  it("no record at all is unknown, not missing", () => {
    const r = getMissingShots(kid(), allRequirements, allIntervals, today, false)
    expect(r.every((x) => x.status === "unknown")).toBe(true)
    expect(getChildStatus(r)).toBe("unknown")
  })
  it("complete record is up to date", () => {
    const doses = [1, 2, 3, 4, 5].map((n) => dose("dtap", `2020-0${n}-01`)).concat(
      [1, 2, 3, 4].map((n) => dose("polio", `2020-0${n}-15`)),
    )
    const r = getMissingShots(kid({ doses }), allRequirements, allIntervals, today)
    expect(getChildStatus(r)).toBe("up-to-date")
  })
  it("one dose short is missing with a count", () => {
    const doses = [1, 2, 3, 4].map((n) => dose("dtap", `2020-0${n}-01`))
    const r = getMissingShots(kid({ doses }), allRequirements, allIntervals, today)
    const d = r.find((x) => x.vaccineId === "dtap")!
    expect(d.status).toBe("missing")
    expect(d.dosesMissing).toBe(1)
    expect(getChildStatus(r)).toBe("missing")
  })
  it("a dose given too recently is not yet due", () => {
    const doses = [1, 2, 3, 4].map((n) => dose("dtap", `2020-0${n}-01`)).concat(dose("dtap", "2026-09-01"))
    const r = getMissingShots(kid({ doses: [...doses.slice(0, 4), dose("dtap", "2026-09-01")] }), [
      { ...allRequirements[0], dosesRequired: 6 },
    ], allIntervals, today)
    expect(r[0].status).toBe("not-yet-due")
    expect(r[0].earliestDate).toBe("2026-09-29")
    expect(r[0].verification).toBe("SAMPLE")
  })
  it("a state with no requirements on file is unknown", () => {
    const r = getMissingShots(kid({ state: "TX" }), allRequirements, allIntervals, today)
    expect(r).toEqual([])
    expect(getChildStatus(r)).toBe("unknown")
  })
})

describe("eligibility", () => {
  const pharmacy: Store = { id: "p", name: "Test Pharmacy", state: "OR", vaccines: ["dtap", "polio"], minAge: 0, maxAge: 100, kind: "pharmacy" }
  const base = { vaccineIds: ["dtap"], hasPrescription: false, today }
  it("Oregon: age 7 without a prescription is fine", () => {
    const r = checkEligibility({ ...base, store: pharmacy, birthDate: "2019-04-15", rule: getStateRule("OR", allStateRules) })
    expect(r.eligible).toBe(true)
    expect(r.notices.some((n) => n.includes("not been checked"))).toBe(true)
  })
  it("Oregon: age 6 needs a prescription", () => {
    const rule = getStateRule("OR", allStateRules)
    const no = checkEligibility({ ...base, store: pharmacy, birthDate: "2020-04-15", rule })
    const yes = checkEligibility({ ...base, store: pharmacy, birthDate: "2020-04-15", rule, hasPrescription: true })
    expect(no.eligible).toBe(false)
    expect(yes.eligible).toBe(true)
  })
  it("North Carolina: age 9 needs a prescription for DTaP", () => {
    const rule = getStateRule("NC", allStateRules)
    const r = checkEligibility({ ...base, store: { ...pharmacy, state: "NC" }, birthDate: "2017-04-15", rule })
    expect(r.eligible).toBe(false)
    expect(r.reasons[0]).toMatch(/prescription/i)
  })
  it("North Carolina: flu from age 7 without a prescription", () => {
    const rule = getStateRule("NC", allStateRules)
    const r = checkEligibility({ ...base, vaccineIds: ["flu"], store: { ...pharmacy, state: "NC", vaccines: ["flu"] }, birthDate: "2017-04-15", rule })
    expect(r.eligible).toBe(true)
    expect(r.notices).toContain("Written parental consent is required.")
  })
  it("a state with no researched rule blocks pharmacies and says why", () => {
    const rule = getStateRule("TX", allStateRules)
    const r = checkEligibility({ ...base, store: { ...pharmacy, state: "TX" }, birthDate: "2017-04-15", rule })
    expect(r.eligible).toBe(false)
    expect(r.reasons).toContain("No rules on file, check with the state health department.")
  })
  it("a clinic only follows its own age range", () => {
    const clinic: Store = { ...pharmacy, kind: "clinic", minAge: 0, maxAge: 18 }
    const r = checkEligibility({ ...base, store: clinic, birthDate: "2017-04-15", rule: getStateRule("TX", allStateRules) })
    expect(r.eligible).toBe(true)
  })
})

import { cohortCounts, coverageBy, summarize } from "./cohorts"
import { generateRoster } from "./roster"

describe("roster and cohorts", () => {
  it("same seed gives the same roster", () => {
    expect(generateRoster(7, 300, today)).toEqual(generateRoster(7, 300, today))
    expect(generateRoster(7, 20, today)).not.toEqual(generateRoster(8, 20, today))
  })
  it("makes the requested size with unique ids", () => {
    const r = generateRoster(1, 300, today)
    expect(r).toHaveLength(300)
    expect(new Set(r.map((s) => s.id)).size).toBe(300)
  })
  it("cohort counts add up and include all three groups", () => {
    const s = summarize(generateRoster(1, 300, today), allRequirements, allIntervals, today)
    const c = cohortCounts(s)
    expect(c.upToDate + c.missing + c.unknown).toBe(300)
    expect(c.upToDate).toBeGreaterThan(0)
    expect(c.missing).toBeGreaterThan(0)
    expect(c.unknown).toBeGreaterThan(0)
  })
  it("students in a state with no requirements on file are unknown", () => {
    const s = summarize(generateRoster(1, 300, today), allRequirements, allIntervals, today)
    expect(s.filter((x) => x.student.state !== "OR").every((x) => x.status === "unknown")).toBe(true)
  })
  it("coverage groups by school", () => {
    const s = summarize(generateRoster(1, 300, today), allRequirements, allIntervals, today)
    const rows = coverageBy(s, (st) => st.school, ["dtap", "polio"])
    expect(rows.reduce((n, r) => n + r.size, 0)).toBe(300)
  })
})

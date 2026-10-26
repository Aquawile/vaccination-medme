import { describe, expect, it } from "vitest"
import { summarize } from "./cohorts"
import { auditAlert, conditionalOrOverdueShare, postingText, reportCsv, reportRows, validateReview } from "./report"
import { generateRoster, rosterGrades } from "./roster"
import { allIntervals, allRequirements } from "./rules.data"

const today = "2026-09-08"
const summaries = summarize(generateRoster(2026, 300, today), allRequirements, allIntervals, today)

describe("report worksheet", () => {
  const rows = reportRows(summaries, rosterGrades)
  it("counts every student exactly once", () => expect(rows.reduce((n, r) => n + r.total, 0)).toBe(300))
  it("grade columns add up to the row total", () =>
    rows.forEach((r) => expect(Object.values(r.byGrade).reduce((a, b) => a + b, 0)).toBe(r.total)))
  it("csv has no student names and is marked as a worksheet", () => {
    const csv = reportCsv(rows, rosterGrades, { school: "S", state: "OR", date: today })
    expect(csv).toContain("WORKSHEET, NOT A FILING")
    expect(csv).not.toContain(summaries[0].student.name)
  })
  it("csv neutralizes formula cells", () =>
    expect(reportCsv(rows, rosterGrades, { school: "=BAD", state: "OR", date: today })).toContain("\"'=BAD\""))
  it("posting text hides small cells", () => {
    const small = rows.map((r, i) => (i === 0 ? { ...r, total: 3 } : r))
    expect(postingText(small, { school: "S", date: today })).toContain("fewer than 10")
  })
})

describe("audit alert", () => {
  it("none for a state without a threshold", () => expect(auditAlert("OR", summaries)).toBeNull())
  it("fires over 10% and not at exactly 10%", () => {
    const mk = (n: number) =>
      Array.from({ length: 100 }, (_, i) => ({ category: i < n ? "incomplete" : "complete" })) as never
    expect(auditAlert("CA", mk(11))?.over).toBe(true)
    expect(auditAlert("CA", mk(10))?.over).toBe(false)
    expect(conditionalOrOverdueShare([])).toBe(0)
  })
})

describe("rule review", () => {
  it("verified needs link and date", () => {
    expect(validateReview({ status: "read-on-official-page", sourceUrl: "", lastReviewed: "" }, today)).toHaveLength(2)
    expect(validateReview({ status: "read-on-official-page", sourceUrl: "https://health.example.gov/x", lastReviewed: today }, today)).toHaveLength(0)
  })
  it("rejects a future reviewer date", () =>
    expect(validateReview({ status: "read-on-official-page", sourceUrl: "https://a.gov/x", lastReviewed: "2099-01-01" }, today)).toHaveLength(1))
  it("unverified needs nothing", () => expect(validateReview({ status: "unverified", sourceUrl: "", lastReviewed: "" }, today)).toHaveLength(0))
})

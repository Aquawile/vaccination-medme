import { describe, expect, it } from "vitest"
import { buildEvents, countsByDay, monthGrid } from "./calendar"
import type { KeyDate } from "./keyDates"

const kd = (over: Partial<KeyDate>): KeyDate => ({ id: "k", state: "OR", label: "Report due", kind: "fixed-date", date: "2027-01-13", sourceUrl: "https://x.gov", status: "unverified", lastReviewed: "2026-10-26", note: "", ...over })
const summary = (id: string, visitDate?: string) => ({ student: { id, name: id, grade: "K", school: "S", visitDate } }) as never

describe("calendar events", () => {
  it("includes visits, notices and only this state's fixed dates", () => {
    const events = buildEvents([summary("a", "2026-09-10"), summary("b")], [{ date: "2026-09-08", audience: "x", studentIds: ["a", "b"] }], [kd({}), kd({ state: "NC" }), kd({ kind: "rolling", date: undefined })], "OR")
    expect(events.map((e) => e.type).sort()).toEqual(["deadline", "notice", "visit"])
  })
  it("sorts by date", () => {
    const events = buildEvents([summary("a", "2026-09-10"), summary("b", "2026-09-09")], [], [], "OR")
    expect(events.map((e) => e.date)).toEqual(["2026-09-09", "2026-09-10"])
  })
  it("counts per day", () => {
    const m = countsByDay(buildEvents([summary("a", "2026-09-10"), summary("b", "2026-09-10")], [], [], "OR"))
    expect(m.get("2026-09-10")?.visit).toBe(2)
  })
})
describe("month grid", () => {
  it("covers whole weeks and marks days in the month", () => {
    const g = monthGrid(2026, 8) // September 2026 starts on a Tuesday
    expect(g.every((w) => w.length === 7)).toBe(true)
    expect(g[0][0].date).toBe("2026-08-30")
    expect(g.flat().filter((d) => d.inMonth)).toHaveLength(30)
  })
  it("handles a month that starts on Sunday", () => expect(monthGrid(2026, 1)[0][0].date).toBe("2026-02-01"))
})

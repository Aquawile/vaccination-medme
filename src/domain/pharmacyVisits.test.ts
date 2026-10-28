import { describe, expect, it } from "vitest"
import { dayStats, fakeReply, fillVisit, firstBusyDay, overlapping, statusOf, visitsFromRoster, type Visit } from "./pharmacyVisits"

const s = (id: string, visitDate?: string, missing: string[] = []) => ({ student: { id, name: id, grade: "K", visitDate }, missing }) as never
const v = (over: Partial<Visit> = {}): Visit => ({ id: "V-1", date: "2026-09-10", time: "09:00", name: "Ana", grade: "K", vaccines: ["dtap"], origin: "family", pharmacist: "Jordan Ellis", ...over })

describe("pharmacy visits", () => {
  it("makes one visit per booked student and spreads times", () => {
    const out = visitsFromRoster([s("a", "2026-09-10"), s("b", "2026-09-10"), s("c")])
    expect(out).toHaveLength(2)
    expect(out[0].time).not.toBe(out[1].time)
  })
  it("defaults to booked and respects marks", () => {
    expect(statusOf(v(), {})).toBe("booked")
    expect(statusOf(v(), { "V-1": "no-show" })).toBe("no-show")
    expect(statusOf(v(), { "V-1": "no-show" }, true)).toBe("completed")
  })
  it("counts a day", () => {
    const visits = [v(), v({ id: "V-2" }), v({ id: "V-3", date: "2026-09-11" })]
    expect(dayStats(visits, { "V-2": "checked-in" }, "2026-09-10")).toEqual({ total: 2, booked: 1, checkedIn: 1, completed: 0, noShow: 0 })
  })
  it("finds the first busy day, or falls back", () => {
    expect(firstBusyDay([v({ date: "2026-09-12" }), v({ date: "2026-09-10" })], "2026-09-08")).toBe("2026-09-10")
    expect(firstBusyDay([], "2026-09-08")).toBe("2026-09-08")
  })
  it("fills fields and leaves unknown ones", () => {
    const out = fillVisit("{student} {time} {vaccines} {short} {other}", v(), { pharmacy: "P", vaccineName: () => "DTaP", short: "" })
    expect(out).toBe("Ana 09:00 DTaP none right now {other}")
  })
  it("finds other visits at the same time", () => {
    const a = v(), b = v({ id: "V-2", pharmacist: "Priya Raman" }), c = v({ id: "V-3", time: "10:00" })
    expect(overlapping([a, b, c], a).map((x) => x.id)).toEqual(["V-2"])
  })
  it("gives the same fake reply every time", () => {
    expect(fakeReply("V-1")).toEqual(fakeReply("V-1"))
  })
})

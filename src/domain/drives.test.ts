import { describe, expect, it } from "vitest"
import { allDrivePharmacies, driveSlots, maskSmall, respondToDrive } from "./drives"

const today = "2026-09-08"
const willow = allDrivePharmacies[0]
const oak = allDrivePharmacies[1]

describe("drive slots", () => {
  it("one slot per slot length", () => expect(driveSlots("15:00", 1, 15)).toEqual(["15:00", "15:15", "15:30", "15:45"]))
  it("drops a slot that would run past the end", () => expect(driveSlots("15:00", 1, 25)).toHaveLength(2))
})
describe("pharmacy response", () => {
  it("accepts an open day with room", () => expect(respondToDrive(willow, { date: "2026-09-15", startTime: "15:00", hours: 3, families: 30 }, today).accepted).toBe(true))
  it("declines a closed day", () => {
    const r = respondToDrive(oak, { date: "2026-09-12", startTime: "15:00", hours: 3, families: 5 }, today) // a Saturday
    expect(r.accepted).toBe(false)
  })
  it("declines when families exceed the room", () => {
    const r = respondToDrive(oak, { date: "2026-09-15", startTime: "15:00", hours: 3, families: 30 }, today)
    expect(r).toMatchObject({ accepted: false })
  })
  it("declines today and past dates", () => expect(respondToDrive(willow, { date: today, startTime: "15:00", hours: 2, families: 1 }, today).accepted).toBe(false))
  it("accepts exactly at capacity", () => expect(respondToDrive(oak, { date: "2026-09-15", startTime: "15:00", hours: 8, families: 24 }, today).accepted).toBe(true))
})
describe("small counts", () => {
  it("hides groups under 10", () => {
    expect(maskSmall(3)).toBe("fewer than 10")
    expect(maskSmall(10)).toBe("10")
    expect(maskSmall(0)).toBe("0")
  })
})

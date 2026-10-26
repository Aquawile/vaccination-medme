import drivePharmacies from "../data/drivePharmacies.json"

// DEMO-FAKE: pharmacy capacity and hours are invented sample values.
export type DrivePharmacy = { id: string; name: string; dailyCapacity: number; closedWeekdays: number[]; slotMinutes: number; chairs: number }
export const allDrivePharmacies = drivePharmacies as DrivePharmacy[]

export type DriveRequest = { date: string; startTime: string; hours: number; families: number }
export type DriveResponse = { accepted: true; slots: string[] } | { accepted: false; reason: string }

const pad = (n: number) => String(n).padStart(2, "0")
const weekday = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay()

/** Time slots for a drive, from the start time, one per slot length, across the hours requested. */
export function driveSlots(startTime: string, hours: number, slotMinutes: number): string[] {
  const [h, m] = startTime.split(":").map(Number)
  const start = h * 60 + m
  const out: string[] = []
  for (let t = start; t + slotMinutes <= start + hours * 60; t += slotMinutes) out.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`)
  return out
}

/** The pharmacy's answer to a drive request. It accepts only a day it is open with room for the families. */
export function respondToDrive(pharmacy: DrivePharmacy, req: DriveRequest, today: string): DriveResponse {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.date) || req.date <= today) return { accepted: false, reason: "The date must be after today." }
  if (!/^\d{2}:\d{2}$/.test(req.startTime)) return { accepted: false, reason: "Pick a start time." }
  if (pharmacy.closedWeekdays.includes(weekday(req.date))) return { accepted: false, reason: `${pharmacy.name} is closed that day.` }
  const slots = driveSlots(req.startTime, req.hours, pharmacy.slotMinutes)
  if (slots.length === 0) return { accepted: false, reason: "No time slots fit in those hours." }
  const room = Math.min(slots.length * pharmacy.chairs, pharmacy.dailyCapacity)
  if (req.families > room) return { accepted: false, reason: `${pharmacy.name} can take ${room} visits that day, and ${req.families} families need one.` }
  return { accepted: true, slots }
}

/** Counts shown to a school: aggregate only, small groups hidden. */
export function maskSmall(n: number, min = 10) {
  return n === 0 ? "0" : n < min ? `fewer than ${min}` : String(n)
}

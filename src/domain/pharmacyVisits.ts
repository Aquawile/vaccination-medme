import type { StudentSummary } from "./cohorts"

export type VisitStatus = "booked" | "checked-in" | "completed" | "no-show"
export type Visit = {
  id: string
  date: string
  time: string
  name: string
  grade: string
  vaccines: string[]
  /** "family" visits come from the school roster's bookings; "parent" visits were booked in this app. */
  origin: "family" | "parent"
  appointmentId?: string
  studentId?: string
  /** DEMO-FAKE: seed status for fictional testing, overridden by a pharmacist mark. */
  sampleStatus?: VisitStatus
  /** Who is booked to give the shot. */
  pharmacist: string
}

// DEMO-FAKE: sample pharmacist names. In a real build this comes from the pharmacy's staff schedule.
export const YOU = "Jordan Ellis"
export const COLLEAGUES = ["Priya Raman", "Sam Okafor"]
const STAFF = [YOU, YOU, COLLEAGUES[0], COLLEAGUES[1]]

const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:30"]

/** Booked visits for the pharmacy, one per student with a booked date. Times are spread over the day's slots in a fixed order. */
export function visitsFromRoster(summaries: StudentSummary[]): Visit[] {
  const perDay = new Map<string, number>()
  return summaries
    .filter((s) => s.student.visitDate)
    .map((s) => {
      const date = s.student.visitDate!
      const n = perDay.get(date) ?? 0
      perDay.set(date, n + 1)
      return {
        id: `V-${s.student.id}`,
        date,
        time: SLOTS[n % SLOTS.length],
        name: s.student.name,
        grade: s.student.grade,
        vaccines: s.missing,
        origin: "family" as const,
        studentId: s.student.id,
        pharmacist: STAFF[(n + date.length + Number(date.slice(-2))) % STAFF.length],
      }
    })
}

export function statusOf(v: Visit, marks: Record<string, string>, done = false): VisitStatus {
  if (done) return "completed"
  const m = marks[v.id]
  return m === "checked-in" || m === "completed" || m === "no-show" || m === "booked" ? m : (v.sampleStatus ?? "booked")
}

export function dayStats(visits: Visit[], marks: Record<string, string>, date: string, doneIds: Set<string> = new Set()) {
  const day = visits.filter((v) => v.date === date)
  const count = (s: VisitStatus) => day.filter((v) => statusOf(v, marks, doneIds.has(v.id)) === s).length
  return { total: day.length, booked: count("booked"), checkedIn: count("checked-in"), completed: count("completed"), noShow: count("no-show") }
}

/** The first date on or after `from` that has visits, or `from` when there are none. */
export function firstBusyDay(visits: Visit[], from: string): string {
  const dates = visits.map((v) => v.date).filter((d) => d >= from).sort()
  return dates[0] ?? from
}

/** Fill a message with one visit's details. Unknown fields are left as they are. */
export function fillVisit(text: string, v: Visit, extra: { pharmacy: string; vaccineName: (id: string) => string; short: string }): string {
  const map: Record<string, string> = {
    "{parent}": "Parent or guardian",
    "{student}": v.name,
    "{date}": v.date,
    "{time}": v.time,
    "{pharmacy}": extra.pharmacy,
    "{vaccines}": v.vaccines.length ? v.vaccines.map(extra.vaccineName).join(", ") : "the vaccines you chose",
    "{short}": extra.short || "none right now",
  }
  return Object.entries(map).reduce((t, [k, val]) => t.split(k).join(val), text)
}

/** Other pharmacists' visits that start at the same time as this one. */
export function overlapping(visits: Visit[], v: Visit): Visit[] {
  return visits.filter((o) => o.id !== v.id && o.date === v.date && o.time === v.time)
}

export type ReplyState = { state: "No response yet" | "Opened" | "Replied"; text?: string }
// DEMO-FAKE: replies are made up from the visit id so the sent log has something to show. A real build reads them from the mailbox.
export function fakeReply(visitId: string): ReplyState {
  const n = [...visitId].reduce((a, c) => a + c.charCodeAt(0), 0) % 4
  if (n === 0) return { state: "Replied", text: "Thanks, we will be there." }
  if (n === 1) return { state: "Replied", text: "Can we move this to later in the week?" }
  if (n === 2) return { state: "Opened" }
  return { state: "No response yet" }
}

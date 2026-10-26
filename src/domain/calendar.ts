import type { StudentSummary } from "./cohorts"
import type { KeyDate } from "./keyDates"

export type CalType = "visit" | "notice" | "deadline"
export type CalEvent = { date: string; type: CalType; title: string; detail: string; studentId?: string; sourceUrl?: string }

/** Everything with a date, in one list: booked visits (from the MedMe scheduling system), notices sent, and the state's fixed dates. */
export function buildEvents(
  summaries: StudentSummary[],
  outreach: { date: string; audience: string; studentIds: string[] }[],
  keyDates: KeyDate[],
  state: string,
  extra: CalEvent[] = [],
): CalEvent[] {
  const visits: CalEvent[] = summaries
    .filter((s) => s.student.visitDate)
    .map((s) => ({ date: s.student.visitDate!, type: "visit", title: s.student.name, detail: `Grade ${s.student.grade}, ${s.student.school}`, studentId: s.student.id }))
  const notices: CalEvent[] = outreach.map((b) => ({ date: b.date, type: "notice", title: `Notice to ${b.studentIds.length} families`, detail: b.audience }))
  const deadlines: CalEvent[] = keyDates
    .filter((d) => d.state === state && d.kind === "fixed-date" && d.date)
    .map((d) => ({ date: d.date!, type: "deadline", title: d.label, detail: d.status === "unverified" ? "Unverified. Confirm at the source." : "", sourceUrl: d.sourceUrl }))
  return [...visits, ...notices, ...deadlines, ...extra].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
}

export function countsByDay(events: CalEvent[]) {
  const out = new Map<string, Record<CalType, number>>()
  for (const e of events) {
    const row = out.get(e.date) ?? { visit: 0, notice: 0, deadline: 0 }
    row[e.type] += 1
    out.set(e.date, row)
  }
  return out
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Weeks (Sunday first) covering a month. month is 0 to 11. */
export function monthGrid(year: number, month: number): { date: string; inMonth: boolean }[][] {
  const first = new Date(Date.UTC(year, month, 1))
  const start = new Date(first)
  start.setUTCDate(1 - first.getUTCDay())
  const weeks: { date: string; inMonth: boolean }[][] = []
  const cursor = new Date(start)
  do {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push({ date: iso(cursor), inMonth: cursor.getUTCMonth() === month })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(week)
  } while (cursor.getUTCMonth() === month)
  return weeks
}

/** Sunday to Saturday dates of the week containing a date. */
export function weekOf(date: string): string[] {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d)
    x.setUTCDate(d.getUTCDate() + i)
    return iso(x)
  })
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return iso(d)
}

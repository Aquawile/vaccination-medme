/** All functions take the date as an argument. Nothing here reads the clock. */

export function ageAt(birthDate: string, on: string): number {
  return (
    Number(on.slice(0, 4)) -
    Number(birthDate.slice(0, 4)) -
    (on.slice(5) < birthDate.slice(5) ? 1 : 0)
  )
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00Z`).getTime()
  const b = new Date(`${to}T12:00:00Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Next `count` weekdays strictly after `from`. */
export function nextWeekdays(from: string, count: number): string[] {
  const out: string[] = []
  let cursor = from
  while (out.length < count) {
    cursor = addDays(cursor, 1)
    const day = new Date(`${cursor}T12:00:00Z`).getUTCDay()
    if (day !== 0 && day !== 6) out.push(cursor)
  }
  return out
}

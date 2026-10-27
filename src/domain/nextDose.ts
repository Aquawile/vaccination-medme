import intervals from "../data/intervals.json"

/** The earliest date for a next dose by the interval table. The table is a sample and is not a recommendation. */
export function nextDoseDate(vaccineId: string, doseDate: string, table = intervals): string | null {
  const row = table.find((r) => r.vaccineId === vaccineId)
  if (!row) return null
  const d = new Date(`${doseDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + row.minDaysBetweenDoses)
  return d.toISOString().slice(0, 10)
}

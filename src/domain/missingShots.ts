import { addDays } from "./dates"
import type {
  ChildStatus,
  Dose,
  Interval,
  Requirement,
  Student,
  VaccineResult,
} from "./types"

/**
 * Compare a child's recorded doses with the school's requirement list.
 * Pure function. It reports what is missing against the list and never recommends anything.
 * If no requirement is on file for the child's state and grade the result is empty
 * and getChildStatus returns "unknown".
 */
export function getRequirementsFor(
  student: Pick<Student, "state" | "grade">,
  requirements: Requirement[],
): Requirement[] {
  return requirements.filter(
    (r) =>
      r.state === student.state &&
      (r.grade === student.grade || r.grade === "*") &&
      r.status !== "not-researched",
  )
}

export function getMissingShots(
  student: Student,
  requirements: Requirement[],
  intervals: Interval[],
  today: string,
  /** true when the family has no record at all (not even an empty one) */
  hasRecord = true,
): VaccineResult[] {
  return getRequirementsFor(student, requirements).map((req) => {
    const given: Dose[] = student.doses
      .filter((d) => d.vaccineId === req.vaccineId)
      .sort((a, b) => a.date.localeCompare(b.date))
    const interval = intervals.find((i) => i.vaccineId === req.vaccineId)
    const base = {
      vaccineId: req.vaccineId,
      dosesRequired: req.dosesRequired,
      dosesRecorded: given.length,
      sourceUrl: req.sourceUrl,
      verification: req.status,
    } as const

    if (!hasRecord && given.length === 0)
      return { ...base, status: "unknown", dosesMissing: req.dosesRequired }

    const dosesMissing = Math.max(0, req.dosesRequired - given.length)
    if (dosesMissing === 0) return { ...base, status: "complete", dosesMissing }

    const last = given[given.length - 1]
    if (last && interval) {
      const earliest = addDays(last.date, interval.minDaysBetweenDoses)
      if (earliest > today)
        return {
          ...base,
          status: "not-yet-due",
          dosesMissing,
          earliestDate: earliest,
          verification: interval.status === "SAMPLE" ? "SAMPLE" : req.status,
        }
      return {
        ...base,
        status: "missing",
        dosesMissing,
        earliestDate: earliest,
        verification: interval.status === "SAMPLE" ? "SAMPLE" : req.status,
      }
    }
    return { ...base, status: "missing", dosesMissing }
  })
}

export function getChildStatus(results: VaccineResult[]): ChildStatus {
  if (results.length === 0) return "unknown"
  if (results.some((r) => r.status === "missing")) return "missing"
  if (results.some((r) => r.status === "unknown")) return "unknown"
  // complete, or only not-yet-due doses left: nothing is overdue
  return "up-to-date"
}

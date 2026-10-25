import { getChildStatus, getMissingShots } from "./missingShots"
import type { ChildStatus, Interval, Requirement, Student, VaccineResult } from "./types"

export type StudentSummary = {
  student: Student
  status: ChildStatus
  results: VaccineResult[]
  /** vaccine ids that are missing doses */
  missing: string[]
}

export function summarize(
  roster: Student[],
  requirements: Requirement[],
  intervals: Interval[],
  today: string,
): StudentSummary[] {
  return roster.map((student) => {
    const results = getMissingShots(student, requirements, intervals, today)
    return {
      student,
      status: getChildStatus(results),
      results,
      missing: results.filter((r) => r.status === "missing").map((r) => r.vaccineId),
    }
  })
}

export function cohortCounts(summaries: StudentSummary[]) {
  const count = (s: ChildStatus) => summaries.filter((x) => x.status === s).length
  return {
    total: summaries.length,
    upToDate: count("up-to-date"),
    missing: count("missing"),
    unknown: count("unknown"),
  }
}

/** Coverage per vaccine for a group: students with that vaccine complete, of those with a requirement for it. */
export function coverageBy(
  summaries: StudentSummary[],
  key: (s: Student) => string,
  vaccineIds: string[],
) {
  const groups = new Map<string, StudentSummary[]>()
  for (const s of summaries) {
    const k = key(s.student)
    groups.set(k, [...(groups.get(k) ?? []), s])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([group, members]) => ({
      group,
      size: members.length,
      byVaccine: Object.fromEntries(
        vaccineIds.map((id) => {
          const withReq = members.filter((m) => m.results.some((r) => r.vaccineId === id))
          const done = withReq.filter((m) =>
            m.results.some((r) => r.vaccineId === id && r.status === "complete"),
          ).length
          return [id, { done, of: withReq.length }]
        }),
      ),
    }))
}

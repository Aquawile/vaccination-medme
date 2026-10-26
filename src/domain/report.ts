import reportRules from "../data/reportRules.json"
import { categoryLabels, categoryOrder } from "./categories"
import type { StudentSummary } from "./cohorts"
import type { SchoolCategory, VerificationStatus } from "./types"

export type ReportRule = {
  state: string
  kind: "audit-share"
  share: number
  label: string
  sourceUrl: string
  status: VerificationStatus
  lastReviewed: string
  note: string
}
export const allReportRules = reportRules as ReportRule[]

export type ReportRow = { category: SchoolCategory; label: string; byGrade: Record<string, number>; total: number }

/** Counts per category and grade. Every student lands in exactly one row. */
export function reportRows(summaries: StudentSummary[], grades: string[]): ReportRow[] {
  return categoryOrder.map((category) => {
    const mine = summaries.filter((s) => s.category === category)
    const byGrade = Object.fromEntries(grades.map((g) => [g, mine.filter((s) => s.student.grade === g).length]))
    return { category, label: categoryLabels[category], byGrade, total: mine.length }
  })
}

const csvCell = (v: string | number) => {
  const s = String(v)
  return `"${(/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replace(/"/g, '""')}"`
}

/** Worksheet CSV: counts only, no names. A worksheet to copy from, not a filing. */
export function reportCsv(rows: ReportRow[], grades: string[], meta: { school: string; state: string; date: string }) {
  const head = [
    ["DEMO DATA - FICTIONAL STUDENTS - WORKSHEET, NOT A FILING"],
    ["School", meta.school],
    ["State", meta.state],
    ["As of", meta.date],
    [],
    ["Category", ...grades.map((g) => `Grade ${g}`), "Total"],
  ]
  const body = rows.map((r) => [r.label, ...grades.map((g) => r.byGrade[g]), r.total])
  const all = ["All students", ...grades.map((g) => rows.reduce((n, r) => n + r.byGrade[g], 0)), rows.reduce((n, r) => n + r.total, 0)]
  return [...head, ...body, all].map((row) => row.map(csvCell).join(",")).join("\r\n")
}

/** Share of students conditional or overdue: in process, incomplete or insufficient. */
export function conditionalOrOverdueShare(summaries: StudentSummary[]) {
  if (summaries.length === 0) return 0
  const n = summaries.filter((s) => ["in-process", "incomplete", "insufficient"].includes(s.category)).length
  return n / summaries.length
}

export function auditAlert(state: string, summaries: StudentSummary[], rules: ReportRule[] = allReportRules) {
  const rule = rules.find((r) => r.state === state && r.kind === "audit-share")
  if (!rule) return null
  const share = conditionalOrOverdueShare(summaries)
  return { rule, share, over: share > rule.share }
}

/** Plain text with counts only, safe to post on a wall or send to a PTA. No names, no small cells. */
export function postingText(rows: ReportRow[], meta: { school: string; date: string }, minCell = 10) {
  const total = rows.reduce((n, r) => n + r.total, 0)
  const line = (r: ReportRow) =>
    r.total === 0 ? null : `${r.label}: ${r.total < minCell ? `fewer than ${minCell}` : `${r.total} (${Math.round((r.total / total) * 100)}%)`}`
  return [`${meta.school}, as of ${meta.date}. Demo data.`, `Students counted: ${total}`, ...rows.map(line).filter(Boolean)].join("\n")
}

/** A rule review needs a source link and a reviewer date before it can be marked verified. */
export function validateReview(r: { status: string; sourceUrl: string; lastReviewed: string }, today: string): string[] {
  const errors: string[] = []
  if (r.status === "read-on-official-page") {
    if (!/^https:\/\/\S+\.\S+/.test(r.sourceUrl.trim())) errors.push("A source link starting with https:// is required to mark a rule verified.")
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.lastReviewed) || r.lastReviewed > today) errors.push("A reviewer date (YYYY-MM-DD, not in the future) is required to mark a rule verified.")
  }
  return errors
}

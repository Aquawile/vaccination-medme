import { useMemo, useState } from "react"
import { Alert, Badge, Button, Card, Field, Heading } from "../../components/ui"
import { vaccineName } from "../../data/vaccines"
import { studentsCsv } from "../../demo/adminDocs"
import { defaults } from "../../demo/config"
import { downloadBlob } from "../../demo/documents"
import { categoryHelp, categoryLabels, categoryOrder, needsNotice } from "../../domain/categories"
import type { StudentSummary } from "../../domain/cohorts"
import { postingText, reportCsv, reportRows } from "../../domain/report"
import { rosterGrades } from "../../domain/roster"
import type { SchoolCategory } from "../../domain/types"

const PAGE = 12

/** One category at a time: pick it, read what it means, see who is in it. */
export default function CategoryView({ summaries, state, onOpen }: { summaries: StudentSummary[]; state: string; onOpen: (id: string) => void }) {
  const [cat, setCat] = useState<SchoolCategory>("incomplete")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(0)
  const [copied, setCopied] = useState(false)
  const grades = rosterGrades.filter((g) => summaries.some((s) => s.student.grade === g))
  const rows = useMemo(() => reportRows(summaries, grades), [summaries, grades])
  const shown = categoryOrder.filter((c) => c !== "no-rules" || rows.find((r) => r.category === c)!.total > 0)
  const row = rows.find((r) => r.category === cat)!
  const members = summaries.filter((s) => s.category === cat && (!q.trim() || `${s.student.name} ${s.student.id}`.toLowerCase().includes(q.trim().toLowerCase())))
  const pages = Math.max(1, Math.ceil(members.length / PAGE))
  const meta = { school: "All schools", state, date: defaults.referenceDate }
  const choose = (c: SchoolCategory) => { setCat(c); setPage(0); setQ(""); setCopied(false) }
  async function copy() {
    try { await navigator.clipboard.writeText(postingText(rows, meta)); setCopied(true) } catch { setCopied(false) }
  }
  return (
    <Card>
      <div className="section-heading">
        <div>
          <Heading level={2}>Students by category</Heading>
          <p className="muted">{summaries.length} students. Each one is in exactly one category.</p>
        </div>
        <div className="action-row" style={{ margin: 0 }}>
          <Button variant="secondary" onClick={() => downloadBlob(new Blob([reportCsv(rows, grades, meta)], { type: "text/csv;charset=utf-8" }), `category-counts-${state}-demo.csv`)}>Counts (CSV)</Button>
          <Button variant="secondary" onClick={copy}>Copy counts for posting</Button>
        </div>
      </div>
      {copied && <Alert kind="success">Copied. Counts only, no names. Groups under 10 show as "fewer than 10".</Alert>}
      <div className="category-picker" role="tablist" aria-label="Category">
        {shown.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={`category-chip ${cat === c ? "active" : ""}`} onClick={() => choose(c)}>
            <strong>{rows.find((r) => r.category === c)!.total}</strong>
            <span>{categoryLabels[c]}</span>
          </button>
        ))}
      </div>
      <div className="category-detail">
        <div className="section-heading">
          <Heading level={3}>{categoryLabels[cat]}</Heading>
          {(needsNotice as string[]).includes(cat) && <Badge kind="warning">Needs a notice</Badge>}
        </div>
        <p>{categoryHelp[cat].means}</p>
        <p className="muted">{categoryHelp[cat].next}</p>
        <p className="grade-line">{grades.map((g) => <span key={g}>Grade {g}: <strong>{row.byGrade[g]}</strong></span>)}</p>
      </div>
      <div className="controls">
        <Field label="Search this list" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Name or student ID" />
        <div className="action-row" style={{ margin: 0 }}>
          <Button variant="secondary" disabled={members.length === 0} onClick={() => downloadBlob(studentsCsv(summaries.filter((s) => s.category === cat)), `${cat}-students-demo.csv`)}>This list (CSV)</Button>
        </div>
      </div>
      {members.length === 0 ? (
        <p className="empty-state">No students in this list.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Student</th><th>Grade</th><th>School</th><th>Missing</th><th><span className="sr-only">Open</span></th></tr></thead>
            <tbody>
              {members.slice(page * PAGE, page * PAGE + PAGE).map((s) => (
                <tr key={s.student.id}>
                  <td><strong>{s.student.name}</strong><br /><span className="muted">{s.student.id}</span></td>
                  <td>{s.student.grade}</td>
                  <td>{s.student.school}</td>
                  <td>{s.missing.length ? s.missing.map(vaccineName).join(", ") : "None"}</td>
                  <td><Button variant="secondary" onClick={() => onOpen(s.student.id)}>Open</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pager">
        <span className="muted">{members.length} students · page {page + 1} of {pages}</span>
        <span className="action-row" style={{ margin: 0 }}>
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <Button variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
        </span>
      </div>
    </Card>
  )
}

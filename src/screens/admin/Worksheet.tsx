import { useMemo, useState } from "react"
import { Alert, Badge, Button, Card, Heading, Select } from "../../components/ui"
import { stateName } from "../../data/states"
import { defaults } from "../../demo/config"
import { downloadBlob } from "../../demo/documents"
import type { StudentSummary } from "../../domain/cohorts"
import { allKeyDates, daysUntil, keyDatesFor } from "../../domain/keyDates"
import { auditAlert, postingText, reportCsv, reportRows } from "../../domain/report"
import { rosterGrades, rosterSchools } from "../../domain/roster"
import { needsNotice } from "../../domain/categories"

/** The numbers a school copies into its state or county report. A worksheet, not a filing. */
export default function Worksheet({ summaries }: { summaries: StudentSummary[] }) {
  const today = defaults.referenceDate
  const stateOptions = [...new Set([...summaries.map((s) => s.student.state), ...allKeyDates.map((d) => d.state)])].sort()
  const [state, setState] = useState("OR")
  const [school, setSchool] = useState("all")
  const [copied, setCopied] = useState(false)
  const scoped = useMemo(
    () => summaries.filter((s) => s.student.state === state && (school === "all" || s.student.school === school)),
    [summaries, state, school],
  )
  const grades = rosterGrades.filter((g) => scoped.some((s) => s.student.grade === g))
  const rows = useMemo(() => reportRows(scoped, grades), [scoped, grades])
  const alert = auditAlert(state, scoped)
  const dates = keyDatesFor(state, today)
  const schoolName = school === "all" ? "All schools" : school
  const meta = { school: schoolName, state, date: today }
  const posting = postingText(rows, meta)
  async function copy() {
    try {
      await navigator.clipboard.writeText(posting)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <Card>
      <div className="section-heading">
        <div>
          <Heading level={2}>Report worksheet</Heading>
          <p className="muted">Counts by category and grade, the numbers states ask schools for. This is a worksheet to copy from, not a filing.</p>
        </div>
        <Badge kind="warning">Unverified rules</Badge>
      </div>
      <div className="action-row">
        <Select label="State" value={state} onChange={(e) => { setState(e.target.value); setCopied(false) }}>
          {stateOptions.map((s) => <option key={s} value={s}>{stateName(s)}</option>)}
        </Select>
        <Select label="School" value={school} onChange={(e) => { setSchool(e.target.value); setCopied(false) }}>
          <option value="all">All schools</option>
          {rosterSchools.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
      {scoped.length === 0 ? (
        <p className="empty-state">No students from {stateName(state)} in this demo roster. Rules and dates for this state are still shown below.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Category</th>{grades.map((g) => <th key={g}>Grade {g}</th>)}<th>Total</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.category}>
                  <td><strong>{r.label}</strong>{(needsNotice as string[]).includes(r.category) && <span className="muted"> · notice</span>}</td>
                  {grades.map((g) => <td key={g}>{r.byGrade[g]}</td>)}
                  <td>{r.total}</td>
                </tr>
              ))}
              <tr><td><strong>All students</strong></td>{grades.map((g) => <td key={g}><strong>{rows.reduce((n, r) => n + r.byGrade[g], 0)}</strong></td>)}<td><strong>{scoped.length}</strong></td></tr>
            </tbody>
          </table>
        </div>
      )}
      {alert && (
        <Alert kind={alert.over ? "warning" : "info"}>
          {alert.rule.label}. Right now {Math.round(alert.share * 100)}% of these students are in process, incomplete or insufficient
          {alert.over ? ", which is over the line." : ", which is under the line."} {alert.rule.status === "unverified" ? "Unverified. " : ""}{alert.rule.note}
        </Alert>
      )}
      <div className="action-row">
        <Button variant="secondary" disabled={scoped.length === 0} onClick={() => downloadBlob(new Blob([reportCsv(rows, grades, meta)], { type: "text/csv;charset=utf-8" }), `report-worksheet-${state}-demo.csv`)}>Worksheet (CSV)</Button>
        <Button variant="secondary" disabled={scoped.length === 0} onClick={copy}>Copy counts-only text for posting</Button>
      </div>
      {copied && <Alert kind="success">Copied. Counts only, no names, and groups under 10 are shown as "fewer than 10".</Alert>}
      <Heading level={3}>Dates to know in {stateName(state)}</Heading>
      {dates.upcoming.length + dates.rolling.length === 0 ? (
        <p className="muted">No dates on file. Check with the state health department.</p>
      ) : (
        <ul>
          {[...dates.upcoming, ...dates.rolling].map((d) => (
            <li key={d.id}>
              <strong>{d.label}</strong>
              {d.kind === "fixed-date" ? `: ${d.date} (${daysUntil(d.date!, today)} days)` : `: ${d.rule}`}
              <span className="muted"> · {d.status === "unverified" ? "Unverified" : d.status}, reviewed {d.lastReviewed}. {d.note}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

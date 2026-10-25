import { useState } from "react"
import { Badge, Card, Heading, Select } from "../../components/ui"
import { coverageBy, type StudentSummary } from "../../domain/cohorts"
import { vaccineName } from "../../data/vaccines"

const ids = ["dtap", "polio"]

export default function Tracker({ summaries }: { summaries: StudentSummary[] }) {
  const [by, setBy] = useState("school")
  const rows = coverageBy(summaries, (s) => (by === "school" ? s.school : by === "grade" ? `Grade ${s.grade}` : s.state), ids)
  return (
    <Card>
      <div className="section-heading">
        <div>
          <Heading level={2}>Coverage by vaccine</Heading>
          <p className="muted">Students with each vaccine complete, among students whose state has a requirement on file.</p>
        </div>
        <Badge kind="warning">Requirements unverified</Badge>
      </div>
      <Select label="Group by" value={by} onChange={(e) => setBy(e.target.value)}>
        <option value="school">School</option>
        <option value="grade">Grade</option>
        <option value="state">State</option>
      </Select>
      <div className="table-scroll">
        <table className="cov-table">
          <thead><tr><th>Group</th><th>Students</th>{ids.map((id) => <th key={id}>{vaccineName(id)}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.group}>
                <td><strong>{r.group}</strong></td>
                <td>{r.size}</td>
                {ids.map((id) => {
                  const v = r.byVaccine[id]
                  const pct = v.of ? Math.round((v.done / v.of) * 100) : 0
                  return <td key={id}>{v.of ? <><span className="mini"><i style={{ width: `${pct}%` }} /></span>{pct}% <span className="muted">({v.done}/{v.of})</span></> : <span className="muted">No requirement on file</span>}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

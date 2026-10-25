import { useState } from "react"
import { Badge, Card, Heading, Select } from "../../components/ui"
import { coverageBy, type StudentSummary } from "../../domain/cohorts"
import { vaccineName } from "../../data/vaccines"

const ids = ["dtap", "polio"]

export default function Tracker({ summaries }: { summaries: StudentSummary[] }) {
  const [by, setBy] = useState("school")
  const rows = coverageBy(summaries, (s) => (by === "school" ? s.school : by === "grade" ? `Grade ${s.grade}` : s.state), ids)
  return (
    <Card className="tracker-card">
      <div className="section-heading">
        <div>
          <Heading level={2}>Vaccination tracker</Heading>
          <p className="muted">Share of students with each vaccine complete. Computed from the roster, only for students whose state has a requirement on file.</p>
        </div>
        <Badge kind="warning">Requirements unverified</Badge>
      </div>
      <Select label="Group by" value={by} onChange={(e) => setBy(e.target.value)}>
        <option value="school">School</option>
        <option value="grade">Grade</option>
        <option value="state">State</option>
      </Select>
      {rows.map((r) => (
        <div key={r.group} style={{ marginBottom: "var(--space-5)" }}>
          <strong>{r.group}</strong> <span className="muted">· {r.size} students</span>
          {ids.map((id) => {
            const v = r.byVaccine[id]
            return (
              <div className="tracker-row" key={id}>
                <span>{vaccineName(id)}</span>
                <div className="tracker-bar"><i style={{ width: `${v.of ? (v.done / v.of) * 100 : 0}%` }} /></div>
                <strong>{v.of ? `${v.done}/${v.of}` : "n/a"}</strong>
              </div>
            )
          })}
        </div>
      ))}
    </Card>
  )
}

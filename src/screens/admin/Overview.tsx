import { Badge, Button, Card, Heading, StatusBadge } from "../../components/ui"
import { buildQueues, cohortCounts, type StudentSummary } from "../../domain/cohorts"
import { vaccineName } from "../../data/vaccines"
import { dateLabel } from "../../demo/journey"
import type { StudentFilter } from "./Students"

const pct = (n: number, t: number) => (t ? Math.round((n / t) * 100) : 0)

export default function Overview({
  summaries,
  openStudents,
  openOutreach,
  openProfile,
}: {
  summaries: StudentSummary[]
  openStudents: (patch: Partial<StudentFilter>) => void
  openOutreach: (audience: string) => void
  openProfile: (id: string) => void
}) {
  const c = cohortCounts(summaries)
  const queues = buildQueues(summaries)
  const booked = queues.find((q) => q.id === "booked")!.members.length
  const done = pct(c.upToDate, c.total)
  return (
    <>
      <Card className="headline-card">
        <div className="section-heading">
          <div>
            <Heading level={2}>{c.upToDate} of {c.total} students have every required vaccine</Heading>
            <p className="muted">Measured against the requirement list on file. Requirements are unverified samples.</p>
          </div>
          <Badge kind="warning">Requirements unverified</Badge>
        </div>
        <div className="progress" role="img" aria-label={`${done} percent up to date`}>
          <i style={{ width: `${done}%` }} />
        </div>
        <div className="stat-row">
          <button onClick={() => openStudents({ status: "up-to-date" })}><strong>{c.upToDate}</strong><span>Up to date</span></button>
          <button onClick={() => openStudents({ status: "missing" })}><strong>{c.missing}</strong><span>Missing doses</span></button>
          <button onClick={() => openStudents({ status: "unknown" })}><strong>{c.unknown}</strong><span>Unknown</span></button>
          <button onClick={() => openStudents({ status: "missing" })}><strong>{booked}</strong><span>Visits booked</span></button>
        </div>
        <p className="inline-note">Unknown means no record or no rules on file. It is not counted as missing.</p>
      </Card>
      <div className="queue-grid">
        {queues.map((q) => (
          <Card key={q.id} className="queue-card">
            <div className="section-heading">
              <div>
                <Heading level={2}>{q.label}</Heading>
                <p className="muted">{q.hint}</p>
              </div>
              <strong className="queue-count">{q.members.length}</strong>
            </div>
            <ul className="queue-list">
              {q.members.slice(0, 5).map((m) => (
                <li key={m.student.id}>
                  <button onClick={() => openProfile(m.student.id)}>{m.student.name}</button>
                  <span>
                    Grade {m.student.grade}
                    {m.missing.length ? ` · ${m.missing.map(vaccineName).join(", ")}` : ""}
                    {m.student.visitDate ? ` · ${dateLabel(m.student.visitDate)}` : ""}
                  </span>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
            <div className="action-row">
              <Button variant="secondary" onClick={() => openStudents({ queue: q.id })}>See all {q.members.length}</Button>
              {q.id !== "booked" && q.members.length > 0 && (
                <Button variant="text" onClick={() => openOutreach(q.id)}>Contact families</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

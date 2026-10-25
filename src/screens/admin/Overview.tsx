import { useState } from "react"
import { Alert, Badge, Button, Card, Heading, MetricCard } from "../../components/ui"
import { cohortCounts, type StudentSummary } from "../../domain/cohorts"
import { defaults } from "../../demo/config"
import { useDemo } from "../../state"
import type { StudentFilter } from "./Students"

const pct = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%")

export default function Overview({
  campaign,
  summaries,
  openStudents,
}: {
  campaign: string
  summaries: StudentSummary[]
  openStudents: (patch: Partial<StudentFilter>) => void
}) {
  const { data } = useDemo()
  const [open, setOpen] = useState("")
  const toggle = (label: string) => setOpen(open === label ? "" : label)
  const active = campaign === "fall"
  const generated = data.appointments.filter((a) => a.campaign === campaign && !a.seeded)
  const c = cohortCounts(summaries)
  const metrics: { label: string; value: number; note: string; detail: string }[] = [
    { label: "Scans", value: data.events.filter((e) => e.type === "scan").length, note: "Notice opens · Simulated scans", detail: "A scan is counted when a parent opens the school notice code. Simulated in this demo." },
    { label: "Profiles created", value: data.childSaved ? 1 : 0, note: "Generated demo activity", detail: "Counts child profiles a parent saved during this demo session. The 300 fictional students are not included." },
    { label: "Bookings", value: generated.length, note: "Generated demo activity", detail: "Every booking a parent made, including cancelled ones." },
    { label: "Completed appointments", value: generated.filter((a) => a.doses.length === a.vaccines.length).length, note: "Generated demo activity", detail: "A visit is complete when every selected dose has been saved." },
    { label: "Reported doses", value: generated.reduce((n, a) => n + a.doses.filter((d) => d.reported).length, 0), note: "Generated demo activity", detail: "Counts only saved doses acknowledged by the simulated reporting service." },
  ]
  return (
    <>
      <Alert>
        Activity starts at zero. The funnel counts generated demo activity, not the seeded example. Bookings include cancelled visits; appointment and dose counts are distinct.
      </Alert>
      <div className="metrics">
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} value={active ? m.value : 0} note={m.note} open={open === m.label} onToggle={() => toggle(m.label)}>
            <p className="metric-detail">{m.detail}</p>
          </MetricCard>
        ))}
      </div>
      <Card className="cohort-card">
        <div className="section-heading">
          <div>
            <Heading level={2}>Students by vaccination status</Heading>
            <p className="muted">Against the school's requirement list. Select a box to see those students.</p>
          </div>
          <Badge kind="warning">Requirements unverified</Badge>
        </div>
        <div className="cohort-grid">
          <button className="cohort" onClick={() => openStudents({ status: "up-to-date" })}>
            <span>Children with all required vaccines</span>
            <strong>{c.upToDate}</strong>
            <small>{pct(c.upToDate, c.total)} of {c.total}</small>
          </button>
          <button className="cohort" onClick={() => openStudents({ status: "missing" })}>
            <span>Children missing at least one</span>
            <strong>{c.missing}</strong>
            <small>{pct(c.missing, c.total)} of {c.total}</small>
          </button>
          <button className="cohort" onClick={() => openStudents({ status: "unknown" })}>
            <span>Unknown (no record or no rules on file)</span>
            <strong>{c.unknown}</strong>
            <small>{pct(c.unknown, c.total)} of {c.total} · not counted as missing</small>
          </button>
        </div>
        <p className="inline-note" style={{ marginTop: "var(--space-4)" }}>
          Roster: 300 fictional students at {defaults.campaign}. Counts match the Students tab filters.
        </p>
        <div className="action-row">
          <Button variant="secondary" onClick={() => openStudents({})}>Open all students</Button>
        </div>
      </Card>
    </>
  )
}

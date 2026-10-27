import { useState, type FormEvent } from "react"
import { Alert, Badge, Button, Card, Field, Heading, Select } from "../../components/ui"
import { defaults } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { needsNotice } from "../../domain/categories"
import type { StudentSummary } from "../../domain/cohorts"
import { allDrivePharmacies, maskSmall, respondToDrive } from "../../domain/drives"
import { useDemo } from "../../state"

/** A school nurse sets up a vaccination day with a partner pharmacy and sees counts afterwards. */
export default function Drives({ summaries, onNotify }: { summaries: StudentSummary[]; onNotify: () => void }) {
  const { data, update, event } = useDemo()
  const [school, setSchool] = useState(defaults.schools[0])
  const [pharmacyId, setPharmacyId] = useState(allDrivePharmacies[0].id)
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("15:00")
  const [hours, setHours] = useState("3")
  const [error, setError] = useState("")
  const needing = (name: string) => summaries.filter((s) => s.student.school === name && (needsNotice as string[]).includes(s.category))
  const families = needing(school).length

  function create(e: FormEvent) {
    e.preventDefault()
    const pharmacy = allDrivePharmacies.find((p) => p.id === pharmacyId)!
    const answer = respondToDrive(pharmacy, { date, startTime, hours: Number(hours), families }, defaults.referenceDate)
    const drive = {
      id: `DR-${data.drives.length + 1}`, school, pharmacyId, date, startTime, hours: Number(hours), families,
      status: answer.accepted ? ("accepted" as const) : ("declined" as const),
      reason: answer.accepted ? "" : answer.reason,
      slots: answer.accepted ? answer.slots : [],
    }
    setError(answer.accepted ? "" : answer.reason)
    update((d) => ({ ...d, drives: [drive, ...d.drives] }))
    event(`Drive ${drive.id} ${drive.status} (simulated pharmacy answer)`, "drive")
  }

  return (
    <>
      <p className="muted page-intro">A school vaccination clinic is a day when a partner pharmacy vaccinates students at or near the school. Families usually sign written consent first, and the visit is recorded in the registry afterward. Hours and capacity here are samples.</p>
      <Card>
        <div className="section-heading">
          <div>
            <Heading level={2}>Plan a vaccination day</Heading>
            <p className="muted">Pick a school, a partner pharmacy and a date. The pharmacy answers with accept or decline. Simulated in this demo.</p>
          </div>
          <Badge>{families} families at {school.split(" ")[0]} need a notice</Badge>
        </div>
        <form onSubmit={create} noValidate>
          <div className="controls">
            <Select label="School" value={school} onChange={(e) => setSchool(e.target.value)}>
              {defaults.schools.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Select label="Partner pharmacy" value={pharmacyId} onChange={(e) => setPharmacyId(e.target.value)}>
              {allDrivePharmacies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div className="controls">
            <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Field label="Start time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Select label="Hours open" value={hours} onChange={(e) => setHours(e.target.value)}>
              {["1", "2", "3", "4", "6", "8"].map((h) => <option key={h}>{h}</option>)}
            </Select>
          </div>
          {error && <Alert kind="warning">{error} Pick another date or pharmacy.</Alert>}
          <div className="form-actions"><span>The pharmacy answer is a made-up rule based on sample hours and capacity.</span><Button type="submit">Send request</Button></div>
        </form>
      </Card>
      {data.drives.map((d) => {
        const pharmacy = allDrivePharmacies.find((p) => p.id === d.pharmacyId)!
        const atSchool = summaries.filter((s) => s.student.school === d.school)
        const contacted = new Set(data.outreach.flatMap((b) => b.studentIds))
        const notified = needing(d.school).filter((s) => contacted.has(s.student.id)).length
        const booked = needing(d.school).filter((s) => s.student.visitDate).length
        return (
          <Card key={d.id} style={{ marginTop: "var(--space-5)" }}>
            <div className="section-heading">
              <div>
                <Heading level={3}>{d.school}, {dateLabel(d.date)}</Heading>
                <p className="muted">{pharmacy.name} · {d.startTime} for {d.hours} hours · {d.id}</p>
              </div>
              <Badge kind={d.status === "accepted" ? "success" : "warning"}>{d.status === "accepted" ? "Pharmacy accepted" : "Pharmacy declined"}</Badge>
            </div>
            {d.status === "declined" ? (
              <p>{d.reason}</p>
            ) : (
              <>
                <div className="compose">
                  <div>
                    <div className="eyebrow">LINK FOR THE FAMILY SLIP</div>
                    <p><code>{`https://example.test/#school/${d.school.toLowerCase().replace(/\s+/g, "-")}/${d.id}`}</code></p>
                    <div aria-label="QR code placeholder" style={{ width: 112, height: 112, border: "2px dashed var(--border)", display: "grid", placeItems: "center", textAlign: "center", fontSize: 12 }}>
                      {/* DEMO-FAKE: a real QR code is generated in a production build */}
                      QR code<br />(demo placeholder)
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow">TIME SLOTS ({d.slots.length})</div>
                    <p>{d.slots.slice(0, 8).join(", ")}{d.slots.length > 8 ? ` and ${d.slots.length - 8} more` : ""}</p>
                    <Button variant="secondary" onClick={onNotify}>Write the family message</Button>
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead><tr><th>Drive counts (no names)</th><th>Families</th></tr></thead>
                    <tbody>
                      <tr><td>Students at this school</td><td>{atSchool.length}</td></tr>
                      <tr><td>Families that need a notice</td><td>{maskSmall(needing(d.school).length)}</td></tr>
                      <tr><td>Notified</td><td>{maskSmall(notified)}</td></tr>
                      <tr><td>Visit booked</td><td>{maskSmall(booked)}</td></tr>
                      <tr><td>Proof shared by the family</td><td>Not shared (no family has shared proof in this demo)</td></tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        )
      })}
    </>
  )
}

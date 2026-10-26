import { optedOut } from "../../domain/consent"
import { useMemo, useState } from "react"
import { Alert, Badge, Button, Card, Check, Heading, Select } from "../../components/ui"
import { buildQueues, type StudentSummary } from "../../domain/cohorts"
import { vaccineName } from "../../data/vaccines"
import { defaults } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { useDemo } from "../../state"
import NoticeLog from "./NoticeLog"

// DEMO-FAKE: nothing is emailed. "Send" records the batch on this device so the flow can be shown.
const template = {
  subject: "{student}: school vaccination record needs a look",
  body: "Hello {parent},\n\nThe school's record for {student} does not yet show: {vaccines}. You can see the school's list and book a visit at a participating pharmacy through MedMe. Whether and when to vaccinate is your decision.\n\nIf you already have these records, you can upload them and we will update the school's file.\n\nThank you,\n{school}",
}

export default function Outreach({
  summaries,
  initialAudience,
  selected,
}: {
  summaries: StudentSummary[]
  initialAudience: string
  selected: string[]
}) {
  const { data, update, event } = useDemo()
  const queues = useMemo(() => buildQueues(summaries), [summaries])
  const [audience, setAudience] = useState(initialAudience || "needs-visit")
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [reviewed, setReviewed] = useState(false)
  const [sent, setSent] = useState("")
  const audienceAll =
    audience === "selected"
      ? summaries.filter((s) => selected.includes(s.student.id))
      : (queues.find((q) => q.id === audience)?.members ?? [])
  const recipients = audienceAll.filter((s) => !optedOut(s.student.id))
  const skipped = audienceAll.length - recipients.length
  const contacted = new Set(data.outreach.flatMap((b) => b.studentIds))
  const fresh = recipients.filter((r) => !contacted.has(r.student.id))
  const first = recipients[0]
  const fill = (t: string, key: string, value: string) => t.split(key).join(value)
  const merge = (t: string, s?: StudentSummary) =>
    fill(
      fill(
        fill(fill(t, "{parent}", "Parent or guardian"), "{student}", s?.student.name ?? "your child"),
        "{vaccines}",
        s?.missing.length ? s.missing.map(vaccineName).join(", ") : "records we could not find",
      ),
      "{school}",
      defaults.school,
    )
  function send() {
    const batch = {
      id: `OUT-${data.outreach.length + 1}`,
      date: defaults.referenceDate,
      audience: audience === "selected" ? "Selected students" : (queues.find((q) => q.id === audience)?.label ?? audience),
      studentIds: recipients.map((r) => r.student.id),
      subject,
      body,
    }
    update((d) => ({ ...d, outreach: [batch, ...d.outreach] }))
    event(`Follow-up recorded for ${recipients.length} families (simulated)`, "outreach")
    setSent(`Recorded for ${recipients.length} families. Simulated: nothing was emailed.`)
    setReviewed(false)
  }
  return (
    <>
      <Card>
        <div className="section-heading">
          <div>
            <Heading level={2}>Contact families</Heading>
            <p className="muted">Pick who to reach, check the message, then send. A person approves every message.</p>
          </div>
          <Badge>Template, edited by a person</Badge>
        </div>
        <Select label="Who to contact" value={audience} onChange={(e) => { setAudience(e.target.value); setSent("") }}>
          {queues.filter((q) => q.id !== "booked").map((q) => <option key={q.id} value={q.id}>{q.label} ({q.members.length})</option>)}
          <option value="booked">Visit booked, send a reminder ({queues.find((q) => q.id === "booked")!.members.length})</option>
          <option value="selected">Students I selected ({selected.length})</option>
        </Select>
        <p className="muted">
          <strong>{recipients.length}</strong> families{skipped > 0 && <> ({skipped} opted out of texts and email, skipped)</>} · {fresh.length} not contacted yet · {recipients.length - fresh.length} contacted before
          {recipients.length > 0 && <> · e.g. {recipients.slice(0, 3).map((r) => r.student.name).join(", ")}{recipients.length > 3 ? ` and ${recipients.length - 3} more` : ""}</>}
        </p>
        <div className="compose">
          <div>
            <div className="field"><label htmlFor="o-sub">Subject</label><input id="o-sub" value={subject} onChange={(e) => { setSubject(e.target.value); setSent("") }} /></div>
            <div className="field"><label htmlFor="o-body">Message</label><textarea id="o-body" value={body} onChange={(e) => { setBody(e.target.value); setSent("") }} /></div>
            <small className="muted">Fields filled in for each family: {"{parent}"} {"{student}"} {"{vaccines}"} {"{school}"}. Messages cover scheduling and records only, never medical advice.</small>
          </div>
          <div>
            <div className="eyebrow">PREVIEW{first ? ` FOR ${first.student.name.toUpperCase()}` : ""}</div>
            <div className="preview"><strong>{merge(subject, first)}</strong>{"\n\n"}{merge(body, first)}</div>
          </div>
        </div>
        <Check checked={reviewed} onChange={(e) => setReviewed(e.target.checked)}>I reviewed this message and approve sending it.</Check>
        <div className="action-row">
          <Button disabled={!reviewed || recipients.length === 0} onClick={send}>Send to {recipients.length} families</Button>
        </div>
        {sent && <Alert kind="success">{sent}</Alert>}
      </Card>
      <Card style={{ marginTop: "var(--space-5)" }}>
        <Heading level={2}>Sent</Heading>
        {data.outreach.length === 0 ? (
          <p className="muted">Nothing sent yet.</p>
        ) : (
          <div className="table-scroll"><table>
            <thead><tr><th>ID</th><th>Date</th><th>Audience</th><th>Families</th><th>Subject</th></tr></thead>
            <tbody>{data.outreach.map((b) => <tr key={b.id}><td>{b.id}</td><td>{dateLabel(b.date)}</td><td>{b.audience}</td><td>{b.studentIds.length}</td><td>{b.subject.replace("{student}", "[student]")}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
      <NoticeLog summaries={summaries} />
    </>
  )
}

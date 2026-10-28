import { useMemo, useRef, useState } from "react"
import { Alert, Button, Card, Check, Heading, Select } from "../../components/ui"
import { defaults } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { fillVisit, type Visit } from "../../domain/pharmacyVisits"
import { useDemo } from "../../state"
import { vName } from "./usePharmacyVisits"

// DEMO-FAKE: nothing is delivered. "Send" records the message so the flow can be shown. Messages cover scheduling only, never medical advice.
const templates: Record<string, { label: string; subject: string; body: string }> = {
  reminder: { label: "Visit reminder", subject: "Reminder: {student}'s visit on {date} at {time}", body: "Hello {parent},\n\nThis is a reminder that {student} has a vaccination visit at {pharmacy} on {date} at {time} for {vaccines}.\n\nIf you need to change the time, you can do it in the app.\n\nThank you,\n{pharmacy}" },
  noshow: { label: "Missed visit, cancelled", subject: "We missed {student} on {date}", body: "Hello {parent},\n\n{student} did not arrive for the visit on {date} at {time}, so we have cancelled it to free the time for others. You can book a new time in the app whenever you like.\n\nThank you,\n{pharmacy}" },
  short: { label: "Short on a vaccine", subject: "A change to {student}'s visit on {date}", body: "Hello {parent},\n\nWe are short on: {short}. Your visit on {date} at {time} may need a new time. We will confirm, or you can pick another time in the app.\n\nThank you,\n{pharmacy}" },
  custom: { label: "Custom message", subject: "", body: "" },
}
const fields = ["{parent}", "{student}", "{date}", "{time}", "{vaccines}", "{short}", "{pharmacy}"]

export default function Messages({ visits, initial }: { visits: Visit[]; initial: { template: string; ids: string[] } | null }) {
  const { data, update, event } = useDemo()
  const [template, setTemplate] = useState(initial?.template ?? "reminder")
  const [ids, setIds] = useState<string[]>(initial?.ids ?? [])
  const [subject, setSubject] = useState(templates[initial?.template ?? "reminder"].subject)
  const [body, setBody] = useState(templates[initial?.template ?? "reminder"].body)
  const [reviewed, setReviewed] = useState(false)
  const [sent, setSent] = useState("")
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const recipients = useMemo(() => visits.filter((v) => ids.includes(v.id)), [visits, ids])
  const short = data.shortSupply.map(vName).join(", ")
  const first = recipients[0]
  const fill = (t: string, v: Visit) => fillVisit(t, v, { pharmacy: defaults.pharmacy, vaccineName: vName, short })
  const days = [...new Set(visits.map((v) => v.date))].slice(0, 14)
  const pickTemplate = (t: string) => { setTemplate(t); setSubject(templates[t].subject); setBody(templates[t].body); setSent("") }
  const insert = (f: string) => {
    const el = bodyRef.current
    const at = el ? el.selectionStart : body.length
    setBody(body.slice(0, at) + f + body.slice(at)); setSent("")
  }
  function send() {
    const m = { id: `PM-${data.pharmacyMessages.length + 1}`, date: defaults.referenceDate, kind: templates[template].label, subject, body, visitIds: recipients.map((r) => r.id), appointmentIds: recipients.filter((r) => r.appointmentId).map((r) => r.appointmentId!), filled: Object.fromEntries(recipients.filter((r) => r.appointmentId).map((r) => [r.appointmentId!, { subject: fill(subject, r), body: fill(body, r) }])) }
    update((d) => {
      const cancel = template === "noshow"
      return { ...d, pharmacyMessages: [m, ...d.pharmacyMessages], appointments: cancel ? d.appointments.map((a) => (m.appointmentIds.includes(a.id) && !a.doses.length ? { ...a, cancelled: true } : a)) : d.appointments }
    })
    event(`Pharmacy message recorded for ${recipients.length} families (simulated)`, "pharmacy-message")
    setSent(`Recorded for ${recipients.length} families. Simulated: nothing was delivered.${template === "noshow" ? " Visits booked in the app were cancelled and their times freed." : ""}`)
    setReviewed(false)
  }
  return (
    <>
      <Card>
        <Heading level={2}>Message families</Heading>
        <p className="muted">Scheduling messages only. Fields fill in for each family. A person reviews every message before it is recorded as sent.</p>
        <div className="controls">
          <Select label="Template" value={template} onChange={(e) => pickTemplate(e.target.value)}>
            {Object.entries(templates).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </Select>
          <Select label="Add all visits on" value="" onChange={(e) => { if (e.target.value) { setIds([...new Set([...ids, ...visits.filter((v) => v.date === e.target.value).map((v) => v.id)])]); setSent("") } }}>
            <option value="">Choose a day</option>
            {days.map((d) => <option key={d} value={d}>{dateLabel(d)}</option>)}
          </Select>
        </div>
        <p className="muted"><strong>{recipients.length}</strong> families{recipients.length > 0 && <> · e.g. {recipients.slice(0, 3).map((r) => r.name).join(", ")}{recipients.length > 3 ? ` and ${recipients.length - 3} more` : ""}</>} {ids.length > 0 && <Button variant="text" onClick={() => setIds([])}>Clear</Button>}</p>
        <div className="compose">
          <div>
            <div className="field"><label htmlFor="pm-sub">Subject</label><input id="pm-sub" value={subject} onChange={(e) => { setSubject(e.target.value); setSent("") }} /></div>
            <div className="field"><label htmlFor="pm-body">Message</label><textarea id="pm-body" ref={bodyRef} value={body} onChange={(e) => { setBody(e.target.value); setSent("") }} /></div>
            <div className="chip-row" role="group" aria-label="Insert a field">
              {fields.map((f) => <button key={f} type="button" className="filter-chip" onClick={() => insert(f)}>{f}</button>)}
            </div>
            <small className="muted">Short on supply right now: {short || "nothing marked"}. Change this in Settings.</small>
          </div>
          <div>
            <div className="eyebrow">PREVIEW{first ? ` FOR ${first.name.toUpperCase()}` : ""}</div>
            <div className="preview">{first ? <><strong>{fill(subject, first)}</strong>{"\n\n"}{fill(body, first)}</> : "Choose who to message to see the preview."}</div>
          </div>
        </div>
        <Check checked={reviewed} onChange={(e) => setReviewed(e.target.checked)}>I reviewed this message and approve sending it.</Check>
        <div className="action-row"><Button disabled={!reviewed || recipients.length === 0 || !body.trim()} onClick={send}>Send to {recipients.length} families</Button></div>
        {sent && <Alert kind="success">{sent}</Alert>}
      </Card>
      <Card style={{ marginTop: "var(--space-5)" }}>
        <Heading level={2}>Sent</Heading>
        {data.pharmacyMessages.length === 0 ? <p className="muted">Nothing sent yet.</p> : (
          <div className="table-scroll"><table>
            <thead><tr><th>ID</th><th>Date</th><th>Type</th><th>Families</th><th>Subject</th></tr></thead>
            <tbody>{data.pharmacyMessages.map((m) => <tr key={m.id}><td>{m.id}</td><td>{dateLabel(m.date)}</td><td>{m.kind}</td><td>{m.visitIds.length}</td><td>{m.subject}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
    </>
  )
}

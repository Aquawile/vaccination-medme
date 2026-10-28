import { Fragment, useMemo, useRef, useState } from "react"
import { Alert, Button, Card, Check, Heading, Select } from "../../components/ui"
import { defaults } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { builtInTemplates, mergeFields, reminderDate, type Template } from "../../domain/pharmacyTemplates"
import { fakeReply, fillVisit, type Visit } from "../../domain/pharmacyVisits"
import { useDemo } from "../../state"
import { vName } from "./usePharmacyVisits"
import { useSendMessage } from "./useSendMessage"

// DEMO-FAKE: stands in for the mailbox the message was sent from. A real build links to the actual sent message.
const GMAIL_SENT = "https://mail.google.com/mail/u/0/#sent"

export default function Messages({ visits, initial, onSettings }: { visits: Visit[]; initial: { template: string; ids: string[] } | null; onSettings: () => void }) {
  const { data, update } = useDemo()
  const send = useSendMessage()
  const all: Record<string, Template> = useMemo(() => ({ ...builtInTemplates, ...Object.fromEntries(data.customTemplates.map((t) => [t.id, t])) }), [data.customTemplates])
  const [key, setKey] = useState(initial?.template ?? "reminder")
  const [ids, setIds] = useState<string[]>(initial?.ids ?? [])
  const [subject, setSubject] = useState(all[key]?.subject ?? "")
  const [body, setBody] = useState(all[key]?.body ?? "")
  const [reviewed, setReviewed] = useState(false)
  const [sent, setSent] = useState("")
  const [find, setFind] = useState("")
  const [tName, setTName] = useState("")
  const [open, setOpen] = useState("")
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const rule = data.reminderRule
  const short = data.shortSupply.map(vName).join(", ")
  const fill = (t: string, v: Visit) => fillVisit(t, v, { pharmacy: defaults.pharmacy, vaccineName: vName, short })
  const recipients = visits.filter((v) => ids.includes(v.id))
  const first = recipients[0]
  const matches = find.trim().length > 0 ? visits.filter((v) => v.name.toLowerCase().includes(find.trim().toLowerCase()) && !ids.includes(v.id)).slice(0, 6) : []
  const pick = (k: string) => { setKey(k); setSubject(all[k].subject); setBody(all[k].body); setSent("") }
  const insert = (f: string) => { const at = bodyRef.current ? bodyRef.current.selectionStart : body.length; setBody(body.slice(0, at) + f + body.slice(at)); setSent("") }
  const remindedIds = new Set(data.pharmacyMessages.filter((m) => m.kind === all[rule.template]?.label).flatMap((m) => m.visitIds))
  const upcoming = visits.filter((v) => v.date >= defaults.referenceDate).slice(0, 40).map((v) => ({ v, on: reminderDate(v.date, rule.days) }))
  const due = upcoming.filter((u) => u.on <= defaults.referenceDate && !remindedIds.has(u.v.id))

  function submit() {
    send(key, { label: all[key]?.label ?? "Custom message", subject, body }, recipients)
    setSent(`Recorded for ${recipients.length} ${recipients.length === 1 ? "family" : "families"}. Simulated: nothing was delivered.${key === "noshow" ? " Visits booked in the app were cancelled and their times freed." : ""}`)
    setReviewed(false); setIds([])
  }
  function sendDue() {
    const t = all[rule.template]
    send(rule.template, t, due.map((u) => u.v))
    setSent(`Reminders recorded for ${due.length} families. Simulated: nothing was delivered.`)
  }
  function saveTemplate() {
    const id = `custom-${data.customTemplates.length + 1}`
    update((d) => ({ ...d, customTemplates: [...d.customTemplates, { id, label: tName.trim(), subject, body }] }))
    setKey(id); setTName("")
  }
  return (
    <>
      <Card className="pharmacy-message-status">
        <div className="section-heading"><div><Heading level={2}>Reminder queue</Heading><p className="muted">Automation is configured once in Settings, not per appointment.</p></div><Button variant="secondary" onClick={() => onSettings()}>Open settings</Button></div>
        <div className="pharmacy-reminder-metrics"><div><strong>{due.length}</strong><span>Due</span></div><div><strong>{upcoming.length - due.length}</strong><span>Upcoming</span></div><div><strong>{rule.auto ? "On" : "Off"}</strong><span>Automatic sending</span></div></div>
        <p className="muted">Rule: {rule.days} day{rule.days === 1 ? "" : "s"} before a visit · {all[rule.template]?.label ?? "Saved template"}. Demo only: no email or text is delivered.</p>
        {!rule.auto && <div className="action-row"><Button disabled={due.length === 0} onClick={sendDue}>Record {due.length} due reminders</Button></div>}
        <details className="peek"><summary>Review scheduled reminders</summary>
          <div className="table-scroll"><table><thead><tr><th>Child</th><th>Visit</th><th>Reminder</th><th>Status</th></tr></thead><tbody>{upcoming.slice(0, 20).map(({ v, on }) => <tr key={v.id}><td>{v.name}</td><td>{dateLabel(v.date)} {v.time}</td><td>{dateLabel(on)}</td><td>{remindedIds.has(v.id) ? "Recorded" : on <= defaults.referenceDate ? "Due" : "Scheduled"}</td></tr>)}</tbody></table></div>
          {upcoming.length > 20 && <p className="muted">Showing 20 of {upcoming.length}. Use the calendar to review other dates.</p>}
        </details>
      </Card>
      <Card style={{ marginTop: "var(--space-5)" }}>
        <Heading level={2}>Message families</Heading>
        <p className="muted">Scheduling messages only. Fields fill in for each family. A person reviews every message before it is recorded as sent.</p>
        <div className="controls">
          <Select label="Template" value={key} onChange={(e) => pick(e.target.value)}>
            {Object.entries(all).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
          </Select>
          <div className="field">
            <label htmlFor="pm-find">Add a family</label>
            <input id="pm-find" value={find} onChange={(e) => setFind(e.target.value)} placeholder="Child's name" />
          </div>
        </div>
        {matches.length > 0 && <div className="chip-row" role="group" aria-label="Matching families">{matches.map((v) => <button key={v.id} className="filter-chip" onClick={() => { setIds([...ids, v.id]); setFind(""); setSent("") }}>{v.name} · {dateLabel(v.date)}</button>)}</div>}
        <p className="muted"><strong>{recipients.length}</strong> {recipients.length === 1 ? "family" : "families"}{recipients.length > 0 && <>: {recipients.slice(0, 3).map((r) => r.name).join(", ")}{recipients.length > 3 ? ` and ${recipients.length - 3} more` : ""}</>} {ids.length > 0 && <Button variant="text" onClick={() => setIds([])}>Clear</Button>}</p>
        <div className="compose">
          <div>
            <div className="field"><label htmlFor="pm-sub">Subject</label><input id="pm-sub" value={subject} onChange={(e) => { setSubject(e.target.value); setSent("") }} /></div>
            <div className="field"><label htmlFor="pm-body">Message</label><textarea id="pm-body" ref={bodyRef} value={body} onChange={(e) => { setBody(e.target.value); setSent("") }} /></div>
            <div className="chip-row" role="group" aria-label="Insert a field">
              {mergeFields.map((f) => <button key={f} type="button" className="filter-chip" onClick={() => insert(f)}>{f}</button>)}
            </div>
            <small className="muted">Short on supply right now: {short || "nothing marked"}. Change this in Settings.</small>
            <div className="controls" style={{ marginTop: "var(--space-3)" }}>
              <div className="field"><label htmlFor="pm-tname">Save as my template</label><input id="pm-tname" value={tName} onChange={(e) => setTName(e.target.value)} placeholder="Template name" /></div>
              <Button variant="secondary" disabled={!tName.trim() || !body.trim()} onClick={saveTemplate}>Save template</Button>
            </div>
          </div>
          <details className="peek" open={!!first}><summary>Preview{first ? ` for ${first.name}` : ""}</summary>
            <div className="preview">{first ? <><strong>{fill(subject, first)}</strong>{"\n\n"}{fill(body, first)}</> : "Choose who to message to see the preview."}</div>
          </details>
        </div>
        <Check checked={reviewed} onChange={(e) => setReviewed(e.target.checked)}>I reviewed this message and approve sending it.</Check>
        <div className="action-row"><Button disabled={!reviewed || recipients.length === 0 || !body.trim()} onClick={submit}>Send to {recipients.length} {recipients.length === 1 ? "family" : "families"}</Button></div>
        {sent && <Alert kind="success">{sent}</Alert>}
      </Card>
      <Card style={{ marginTop: "var(--space-5)" }}>
        <Heading level={2}>Sent and replies</Heading>
        {data.pharmacyMessages.length === 0 ? <p className="muted">Nothing sent yet.</p> : (
          <div className="table-scroll"><table>
            <thead><tr><th>Date</th><th>Type</th><th>Subject</th><th>Families</th><th>Replies</th></tr></thead>
            <tbody>{data.pharmacyMessages.map((m) => {
              const replies = m.visitIds.filter((id) => fakeReply(id).state === "Replied").length
              return (
                <Fragment key={m.id}>
                  <tr><td>{dateLabel(m.date)}</td><td>{m.kind}{m.auto ? " (auto)" : ""}</td><td>{m.subject}</td><td>{m.visitIds.length}</td><td><button className="link-button" aria-expanded={open === m.id} onClick={() => setOpen(open === m.id ? "" : m.id)}>{replies} of {m.visitIds.length}</button></td></tr>
                  {open === m.id && (
                    <tr><td colSpan={5}>
                      <ul className="reply-list">{m.visitIds.map((id) => {
                        const v = visits.find((x) => x.id === id), r = fakeReply(id)
                        return <li key={id}><strong>{v?.name ?? id}</strong> <span className="muted">{r.state}</span>{r.text && <q>{r.text}</q>}</li>
                      })}</ul>
                      <a href={GMAIL_SENT} target="_blank" rel="noreferrer">Open in Gmail</a> <span className="muted">Demo link. A real build opens the message in the mailbox it was sent from.</span>
                    </td></tr>
                  )}
                </Fragment>
              )
            })}</tbody>
          </table></div>
        )}
      </Card>
    </>
  )
}

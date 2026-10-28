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
  const [mode, setMode] = useState<"group" | "single">("group")
  const [singleId, setSingleId] = useState("")
  const [groupSearch, setGroupSearch] = useState("")
  const [groupScope, setGroupScope] = useState<"all"|"upcoming"|"day"|"checked-in"|"no-show">("all")
  const [preview, setPreview] = useState(false)
  const [tName, setTName] = useState("")
  const [open, setOpen] = useState("")
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const rule = data.reminderRule
  const short = data.shortSupply.map(vName).join(", ")
  const fill = (t: string, v: Visit) => fillVisit(t, v, { pharmacy: defaults.pharmacy, vaccineName: vName, short })
  const recipients = visits.filter((v) => ids.includes(v.id))
  const selected = visits.find((v) => v.id === singleId)
  const filteredVisits = visits.filter((v)=> {
    const status = data.visitMarks[v.id] ?? "booked"
    return (groupScope==="all" || (groupScope==="upcoming" && v.date>=defaults.referenceDate) || (groupScope==="day" && v.date===defaults.referenceDate) || (groupScope==="checked-in" && status==="checked-in") || (groupScope==="no-show" && status==="no-show")) && (v.name+" "+v.grade+" "+v.date).toLowerCase().includes(groupSearch.toLowerCase())
  })
  const selectFiltered = () => setIds((old)=>Array.from(new Set([...old,...filteredVisits.map((v)=>v.id)])))
  const sendingTo = mode === "single" ? (selected ? [selected] : []) : recipients
  const pick = (k: string) => { setKey(k); setSubject(all[k].subject); setBody(all[k].body); setSent("") }
  const insert = (f: string) => { const at = bodyRef.current ? bodyRef.current.selectionStart : body.length; setBody(body.slice(0, at) + f + body.slice(at)); setSent("") }
  const upcoming = visits.filter((v) => v.date >= defaults.referenceDate).map((v) => ({ v, on: reminderDate(v.date, rule.days) }))

  function submit() {
    send(key, { label: all[key]?.label ?? "Custom message", subject, body }, sendingTo)
    setSent(`Recorded for ${sendingTo.length} ${sendingTo.length === 1 ? "family" : "families"}. Simulated: nothing was delivered.${key === "noshow" ? " Visits booked in the app were cancelled and their times freed." : ""}`)
    setReviewed(false); setIds([]); setSingleId("")
  }
  function saveTemplate() {
    const id = `custom-${Date.now()}`
    update((d) => ({ ...d, customTemplates: [...d.customTemplates, { id, label: tName.trim(), subject, body }] }))
    setKey(id); setTName(""); setSent("Template saved locally. No message was sent.")
  }
  return (
    <>
      <Card className="pharmacy-message-status">
        <div className="section-heading"><div><Heading level={2}>Scheduled communications</Heading><p className="muted">Review the automation rules saved in Settings and the dates they would run. Demo only: no email is delivered.</p></div><Button variant="secondary" onClick={onSettings}>Configure automatic messages</Button></div>
        {([...data.automationRules, ...(rule.auto ? [{ id: "default-reminder", template: rule.template, days: rule.days, enabled: true }] : [])].filter((r) => r.enabled)).length === 0
          ? <p className="muted">No automatic messages are enabled.</p>
          : [...data.automationRules, ...(rule.auto ? [{ id: "default-reminder", template: rule.template, days: rule.days, enabled: true }] : [])].filter((r)=>r.enabled).map((r)=><div className="pharmacy-rule-line" key={r.id}><strong>{all[r.template]?.label ?? "Saved template"}</strong><span>{("cadence" in r && r.cadence === "repeat") ? "Every "+r.days+" days (preview only)" : r.days+" days before visits"}</span><span>Enabled</span></div>)}
        <details className="peek"><summary>Illustrative reminder dates</summary><div className="table-scroll"><table><thead><tr><th>Family</th><th>Visit</th><th>Reminder scheduled</th></tr></thead><tbody>{upcoming.slice(0,20).map(({v,on})=><tr key={v.id}><td>{v.name}</td><td>{dateLabel(v.date)} {v.time}</td><td>{dateLabel(on)}</td></tr>)}</tbody></table></div></details>
      </Card>
      <Card className="pharmacy-message-composer" style={{ marginTop: "var(--space-5)" }}>
        <Heading level={2}>Messages and templates</Heading>
        <p className="muted">Save a template without sending. Choose individual families or select a filtered group below; one-family messages have their own tab.</p>
        <div className="seg pharmacy-message-tabs" role="group" aria-label="Compose mode">
          <button className={mode === "group" ? "active" : ""} onClick={() => {setMode("group");setReviewed(false)}} aria-pressed={mode === "group"}>Group or template</button>
          <button className={mode === "single" ? "active" : ""} onClick={() => {setMode("single");setReviewed(false)}} aria-pressed={mode === "single"}>One family</button>
        </div>
        <div className="pharmacy-composer-meta">
          <Select label="Template" value={key} onChange={(e) => pick(e.target.value)}>{Object.entries(all).map(([k,t])=><option key={k} value={k}>{t.label}</option>)}</Select>
          {mode === "single" ? <Select label="Recipient" value={singleId} onChange={(e)=>setSingleId(e.target.value)}><option value="">Choose one family</option>{visits.map((v)=><option key={v.id} value={v.id}>{v.name} · {dateLabel(v.date)} {v.time}</option>)}</Select> :
            <div className="pharmacy-recipient-summary"><strong>{recipients.length} families selected</strong><p className="muted">{recipients.length ? recipients.slice(0,5).map((v)=>v.name).join(", ") : "Open a group from the appointment list to send to those families."}</p></div>}
        </div>
        {mode==="group" && <div className="pharmacy-group-picker">
          <div className="pharmacy-group-tools">
            <Select label="Filter families" value={groupScope} onChange={(e)=>setGroupScope(e.target.value as typeof groupScope)}>
              <option value="all">All booked visits</option><option value="upcoming">Upcoming visits</option><option value="day">Reference date visits</option><option value="checked-in">Checked-in visits</option><option value="no-show">No-shows</option>
            </Select>
            <div className="field"><label htmlFor="pm-group-search">Search children</label><input id="pm-group-search" value={groupSearch} onChange={(e)=>setGroupSearch(e.target.value)} placeholder="Name, grade or date" /></div>
          </div>
          <div className="pharmacy-group-actions"><strong>{ids.length} selected · {filteredVisits.length} matching visits</strong><Button variant="secondary" onClick={selectFiltered}>Select all matching</Button><Button variant="text" onClick={()=>setIds([])}>Clear selection</Button></div>
          <div className="pharmacy-group-list" role="group" aria-label="Choose families for group message">
            {filteredVisits.slice(0,100).map((v)=><label key={v.id} className="pharmacy-group-choice"><input type="checkbox" checked={ids.includes(v.id)} onChange={(e)=>setIds((old)=>e.target.checked?[...old.filter((id)=>id!==v.id),v.id]:old.filter((id)=>id!==v.id))} /><span><strong>{v.name}</strong><small>{dateLabel(v.date)} · {v.time} · {v.pharmacist}</small></span></label>)}
            {filteredVisits.length>100&&<p className="muted">Showing the first 100. Select all matching to include all {filteredVisits.length} visits.</p>}
            {filteredVisits.length===0&&<p className="muted">No matching appointments.</p>}
          </div>
          <p className="muted">Selected recipients remain selected when filters change. No message is sent until you approve and record it below.</p>
        </div>}
        <div className="pharmacy-compose-toggle"><strong>{preview ? "Recipient preview" : "Edit message"}</strong><Button variant="secondary" onClick={()=>setPreview(!preview)}>{preview ? "Edit message" : "Preview for recipient"}</Button></div>
        {preview ? <div className="pharmacy-inline-preview">{sendingTo.length ? <><strong>{fill(subject,sendingTo[0])}</strong><p>{fill(body,sendingTo[0])}</p><small className="muted">Showing {sendingTo[0].name}</small></> : <p className="muted">Choose a recipient to preview personalized content.</p>}</div> :
          <div className="pharmacy-full-compose"><div className="field"><label htmlFor="pm-sub">Subject</label><input id="pm-sub" value={subject} onChange={(e)=>setSubject(e.target.value)} /></div><div className="field"><label htmlFor="pm-body">Message</label><textarea id="pm-body" ref={bodyRef} rows={9} value={body} onChange={(e)=>setBody(e.target.value)} /></div><div className="chip-row">{mergeFields.map((x)=><button key={x} type="button" className="filter-chip" onClick={()=>insert(x)}>{x}</button>)}</div></div>}
        <div className="pharmacy-template-save"><div className="field"><label htmlFor="pm-tname">New template name</label><input id="pm-tname" value={tName} onChange={(e)=>setTName(e.target.value)} placeholder="Name this template" /></div><Button variant="secondary" disabled={!tName.trim() || !subject.trim() || !body.trim()} onClick={saveTemplate}>Save template only</Button></div>
        <div className="pharmacy-send-section"><p className="muted">To: {sendingTo.length ? sendingTo.map((v)=>v.name).slice(0,6).join(", ") : "No families selected"}. Timing: immediate simulated record; automatic schedules are in Settings.</p>
          <Check checked={reviewed} onChange={(e)=>setReviewed(e.target.checked)}>I reviewed the recipients and message.</Check>
          <div className="action-row"><Button disabled={!reviewed || sendingTo.length === 0 || !body.trim() || !subject.trim()} onClick={submit}>Record message for {sendingTo.length} families</Button></div>
        </div>
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

import { useState } from "react"
import { Alert, Badge, Button, Card, Check, Field, Heading, Select } from "../../components/ui"
import officialLinks from "../../data/officialLinks.json"
import { stateName, usStates } from "../../data/states"
import { defaults } from "../../demo/config"
import { useDemo } from "../../state"
import { templates } from "./Outreach"
import { dateLabel } from "../../demo/journey"

const reasons = ["Entered wrong at setup", "School moved to a new campus", "District reassigned the school"]

/** The school's state is set once. Changing it is deliberate: it needs a reason, the school's name, and the admin's password. */
export default function SchoolSettings() {
  const { data, update, event } = useDemo()
  const [open, setOpen] = useState(false)
  const [editId,setEditId]=useState("")
  const [templateLabel,setTemplateLabel]=useState("")
  const [templateSubject,setTemplateSubject]=useState("")
  const [templateBody,setTemplateBody]=useState("")
  const [ruleTemplate,setRuleTemplate]=useState("missing")
  const [ruleAudience,setRuleAudience]=useState("needs-visit")
  const [ruleDate,setRuleDate]=useState("")
  const [editingRule,setEditingRule]=useState("")
  const schoolTemplates={...templates,...Object.fromEntries(data.schoolTemplates.map(t=>[t.id,t]))}
  const editTemplate=(id:string)=>{const t=schoolTemplates[id];setEditId(id);setTemplateLabel(t.label);setTemplateSubject(t.subject);setTemplateBody(t.body)}
  const [next, setNext] = useState("")
  const [reason, setReason] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [sure, setSure] = useState(false)
  const [error, setError] = useState("")
  const links = officialLinks.filter((l) => l.state === data.schoolState)
  const national = officialLinks.filter((l) => l.state === "US")
  const ready = next && next !== data.schoolState && reason && sure
  function reset() { setOpen(false); setNext(""); setReason(""); setName(""); setPassword(""); setSure(false); setError("") }
  function save() {
    if (name.trim().toLowerCase() !== defaults.school.toLowerCase()) return setError("Type the school's name exactly as shown above.")
    // DEMO-FAKE: a real build checks the signed-in administrator's password and asks MedMe to verify with the district.
    if (password !== defaults.password) return setError("That password is not right.")
    update((d) => ({ ...d, schoolState: next, schoolStateLog: [{ time: new Date().toISOString(), from: d.schoolState, to: next, reason }, ...d.schoolStateLog] }))
    event(`School state changed to ${stateName(next)}`, "settings")
    reset()
  }
  return (
    <>
      <Card>
        <div className="section-heading">
          <div>
            <Heading level={2}>{defaults.school}</Heading>
            <p className="muted">State law decides which vaccines this school checks. Each school has one state.</p>
          </div>
          <Badge>{stateName(data.schoolState)}</Badge>
        </div>
        {!open ? (
          <div className="action-row"><Button variant="secondary" onClick={() => setOpen(true)}>Change state</Button></div>
        ) : (
          <div className="secure-change">
            <Alert kind="warning">Changing the state changes the requirements for every student and every report. Only do this to fix a mistake or after a real move. The change is logged.</Alert>
            <div className="controls">
              <Select label="New state" value={next} onChange={(e) => setNext(e.target.value)}>
                <option value="">Choose a state</option>
                {usStates.filter((s) => s.code !== data.schoolState).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </Select>
              <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Choose a reason</option>
                {reasons.map((r) => <option key={r}>{r}</option>)}
              </Select>
              <Field label="Type the school's name" value={name} onChange={(e) => setName(e.target.value)} />
              <Field label="Your password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Check checked={sure} onChange={(e) => setSure(e.target.checked)}>I understand this changes every report.</Check>
            {error && <Alert kind="error">{error}</Alert>}
            <div className="action-row">
              <Button disabled={!ready} onClick={save}>Confirm change</Button>
              <Button variant="secondary" onClick={reset}>Cancel</Button>
            </div>
          </div>
        )}
        {data.schoolStateLog.length > 0 && (
          <>
            <Heading level={3}>Change history</Heading>
            <ul className="link-list">
              {data.schoolStateLog.map((l) => <li key={l.time}>{stateName(l.from)} to {stateName(l.to)} · {l.reason} · <Badge kind="warning">Pending MedMe verification (mock)</Badge></li>)}
            </ul>
          </>
        )}
      </Card>
      <Card className="school-template-settings">
        <Heading level={2}>School message templates</Heading>
        <p className="muted">Edit existing templates here. Saving a template makes it available in Outreach; it does not send or schedule messages.</p>
        <div className="school-template-directory">{Object.entries(schoolTemplates).filter(([id])=>id!=="custom").map(([id,t])=><div className="school-template-entry" key={id}><div><strong>{t.label}</strong><small className="muted">{t.subject}</small></div><Button variant="secondary" onClick={()=>editTemplate(id)}>Edit</Button></div>)}</div>
        <Heading level={3}>{editId ? "Edit template" : "New template"}</Heading>
        <div className="field"><label htmlFor="school-tpl-name">Template name</label><input id="school-tpl-name" value={templateLabel} onChange={e=>setTemplateLabel(e.target.value)} /></div>
        <div className="field"><label htmlFor="school-tpl-subject">Subject</label><input id="school-tpl-subject" value={templateSubject} onChange={e=>setTemplateSubject(e.target.value)} /></div>
        <div className="field"><label htmlFor="school-tpl-body">Message body</label><textarea id="school-tpl-body" rows={7} value={templateBody} onChange={e=>setTemplateBody(e.target.value)} /></div>
        <div className="action-row"><Button disabled={!templateLabel.trim()||!templateSubject.trim()||!templateBody.trim()} onClick={()=>{const id=editId||"school-custom-"+Date.now();update(d=>({...d,schoolTemplates:d.schoolTemplates.some(t=>t.id===id)?d.schoolTemplates.map(t=>t.id===id?{...t,label:templateLabel,subject:templateSubject,body:templateBody}:t):[...d.schoolTemplates,{id,label:templateLabel,subject:templateSubject,body:templateBody}]}));setEditId("");setTemplateLabel("");setTemplateSubject("");setTemplateBody("")}}>{editId?"Save changes":"Save new template"}</Button><Button variant="text" onClick={()=>{setEditId("");setTemplateLabel("");setTemplateSubject("");setTemplateBody("")}}>Clear editor</Button></div>
      </Card>
      <Card className="school-rule-settings">
        <Heading level={2}>Scheduled school messages</Heading>
        <p className="muted">Choose a template, recipient cohort and send date. Scheduling is a saved demonstration only; nothing automatically sends.</p>
        <div className="school-rule-form">
          <Select label="Template" value={ruleTemplate} onChange={e=>setRuleTemplate(e.target.value)}>{Object.entries(schoolTemplates).filter(([id])=>id!=="custom").map(([id,t])=><option key={id} value={id}>{t.label}</option>)}</Select>
          <Select label="Recipients" value={ruleAudience} onChange={e=>setRuleAudience(e.target.value)}><option value="needs-visit">Missing doses, no visit</option><option value="booked">Visit booked</option><option value="no-record">Unknown records</option><option value="missing">Missing doses</option></Select>
          <Field label="Send date (demo)" type="date" value={ruleDate} onChange={e=>setRuleDate(e.target.value)} />
          <Button disabled={!ruleDate} variant="secondary" onClick={()=>{update(d=>({...d,schoolAutomationRules:editingRule?d.schoolAutomationRules.map(r=>r.id===editingRule?{...r,template:ruleTemplate,audience:ruleAudience,sendDate:ruleDate}:r):[...d.schoolAutomationRules,{id:"school-auto-"+Date.now(),template:ruleTemplate,audience:ruleAudience,sendDate:ruleDate,enabled:true}]}));setRuleDate("");setEditingRule("")}}>{editingRule?"Save rule changes":"Save demo rule"}</Button>
        </div>
        {data.schoolAutomationRules.map(r=><div className="school-rule-item" key={r.id}><strong>{schoolTemplates[r.template]?.label??r.template}</strong><span>{r.audience} · {dateLabel(r.sendDate)}</span><div className="school-rule-actions"><Check checked={r.enabled} onChange={e=>update(d=>({...d,schoolAutomationRules:d.schoolAutomationRules.map(x=>x.id===r.id?{...x,enabled:e.target.checked}:x)}))}>Enabled</Check><Button variant="secondary" onClick={()=>{setEditingRule(r.id);setRuleTemplate(r.template);setRuleAudience(r.audience);setRuleDate(r.sendDate)}}>Edit</Button><Button variant="text" onClick={()=>update(d=>({...d,schoolAutomationRules:d.schoolAutomationRules.filter(x=>x.id!==r.id)}))}>Remove</Button></div></div>)}
      </Card>
      <Card style={{ marginTop: "var(--space-5)" }}>
        <Heading level={2}>Official sources</Heading>
        <p className="muted">MedMe does not summarize law. Read it where the government publishes it.</p>
        <Heading level={3}>{stateName(data.schoolState)}</Heading>
        {links.length === 0 ? <p>No official link on file for {stateName(data.schoolState)} yet. Check with the state health department.</p> : <ul className="link-list">{links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>)}</ul>}
        <Heading level={3}>National</Heading>
        <ul className="link-list">{national.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>)}</ul>
      </Card>
    </>
  )
}

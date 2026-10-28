import { useState } from "react"
import { Alert, Button, Card, Check, Field, Heading, Select } from "../../components/ui"
import OfficialSource from "../../components/OfficialSource"
import { states, vaccines } from "../../demo/config"
import { addDays } from "../../domain/calendar"
import { dateLabel } from "../../demo/journey"
import { effectiveLocation, locations } from "../../demo/journey"
import { useDemo } from "../../state"
import { builtInTemplates } from "../../domain/pharmacyTemplates"

/** The pharmacy owner chooses which vaccines and ages are shown to families. Changes from the sample are flagged for a check against the state's own page. */
export default function PublishSettings() {
  const { data, update, event } = useDemo()
  const [id, setId] = useState(locations[0].id)
  const base = locations.find((l) => l.id === id)!
  const current = effectiveLocation(base, data.published)
  const [offered, setOffered] = useState<string[]>(current.vaccines)
  const [minAge, setMinAge] = useState(String(current.minAge))
  const [maxAge, setMaxAge] = useState(String(current.maxAge))
  const [saved, setSaved] = useState("")
  const [autoTemplate, setAutoTemplate] = useState("reminder")
  const [autoDays, setAutoDays] = useState("3")
  const [autoCadence, setAutoCadence] = useState<"before"|"after"|"repeat"|"deadline-before"|"deadline-after">("before")
  const [deadlineDate, setDeadlineDate] = useState("")
  const [deadlineState, setDeadlineState] = useState("Oregon")
  const [deadlineSource, setDeadlineSource] = useState("")
  const [editingRule, setEditingRule] = useState("")
  const [templateName, setTemplateName] = useState("")
  const [templateSubject, setTemplateSubject] = useState("")
  const [templateBody, setTemplateBody] = useState("")
  const [editingTemplate, setEditingTemplate] = useState("")
  const [templateSearch, setTemplateSearch] = useState("")
  const [templateFilter, setTemplateFilter] = useState<"all"|"custom"|"builtin">("all")
  const templates = { ...builtInTemplates, ...Object.fromEntries(data.customTemplates.map((t) => [t.id, t])) }
  const templateLibrary = Object.entries(templates).filter(([id,t])=> (templateFilter==="all" || (templateFilter==="custom" ? id.startsWith("custom-") : !id.startsWith("custom-"))) && (t.label+" "+t.subject+" "+t.body).toLowerCase().includes(templateSearch.trim().toLowerCase()))
  const editSavedTemplate = (t: {id:string;label:string;subject:string;body:string}) => {setEditingTemplate(t.id);setTemplateName(t.label);setTemplateSubject(t.subject);setTemplateBody(t.body)}
  const resetTemplateEditor = () => {setEditingTemplate("");setTemplateName("");setTemplateSubject("");setTemplateBody("")}
  const legalRule = autoCadence.startsWith("deadline-")
  const validDays = Number.isInteger(Number(autoDays)) && Number(autoDays) >= (autoCadence==="repeat"?1:0) && Number(autoDays)<=365
  const validDeadline = !legalRule || (/^\d{4}-\d{2}-\d{2}$/.test(deadlineDate) && /^https:\/\//i.test(deadlineSource.trim()))
  const deadlinePreview = legalRule && deadlineDate && validDays ? addDays(deadlineDate,(autoCadence==="deadline-before"?-1:1)*Number(autoDays)) : ""
  const pick = (next: string) => {
    const l = effectiveLocation(locations.find((x) => x.id === next)!, data.published)
    setId(next); setOffered(l.vaccines); setMinAge(String(l.minAge)); setMaxAge(String(l.maxAge)); setSaved("")
  }
  const changed = offered.slice().sort().join() !== base.vaccines.slice().sort().join() || Number(minAge) !== base.minAge || Number(maxAge) !== base.maxAge
  const invalid = offered.length === 0 || !(Number(minAge) >= 0) || Number(maxAge) < Number(minAge)
  function publish() {
    update((d) => ({ ...d, published: { ...d.published, [id]: { vaccines: offered, minAge: Number(minAge), maxAge: Number(maxAge) } } }))
    event(`Published vaccines and ages for ${base.name}`, "publish")
    setSaved(`Published. Families now see ${offered.map((v) => vaccines.find((x) => x.id === v)?.name).join(", ")} for ages ${minAge} to ${maxAge} at ${base.name}.`)
  }
  return (
    <div className="pharmacy-settings-sections">
    <Card className="pharmacy-settings-section">
      <Heading level={2}>Pharmacy offerings</Heading>
      <p className="muted">Families only see pharmacies that offer the vaccines and ages they need. Sample values, demo only.</p>
      <div className="controls">
        <Select label="Location" value={id} onChange={(e) => pick(e.target.value)}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
        <Field label="Youngest age" type="number" min={0} value={minAge} onChange={(e) => { setMinAge(e.target.value); setSaved("") }} />
        <Field label="Oldest age" type="number" min={0} value={maxAge} onChange={(e) => { setMaxAge(e.target.value); setSaved("") }} />
      </div>
      <fieldset className="publish-vaccines">
        <legend>Vaccines you offer</legend>
        {vaccines.map((v) => (
          <Check key={v.id} checked={offered.includes(v.id)} onChange={(e) => { setOffered(e.target.checked ? [...offered, v.id] : offered.filter((x) => x !== v.id)); setSaved("") }}>{v.name} ({v.detail})</Check>
        ))}
      </fieldset>
    </Card>
    <Card className="pharmacy-settings-section">
      <Heading level={2}>Inventory & supply</Heading>
      <fieldset className="publish-vaccines">
        <legend>Short on supply right now</legend>
        {vaccines.map((v) => (
          <Check key={v.id} checked={data.shortSupply.includes(v.id)} onChange={(e) => update((d) => ({ ...d, shortSupply: e.target.checked ? [...d.shortSupply, v.id] : d.shortSupply.filter((x) => x !== v.id) }))}>{v.name}</Check>
        ))}
        <small className="muted">Fills the {"{short}"} field when you message families.</small>
      </fieldset>
    </Card>
    <Card className="pharmacy-settings-section">
      <Heading level={2}>Message templates</Heading>
      <p className="muted">Browse every available template here. Edit saved templates, or make an editable copy of a built-in template. Saving does not send or automate anything.</p>
      <div className="pharmacy-template-search">
        <div className="field"><label htmlFor="pst-search">Find a template</label><input id="pst-search" value={templateSearch} onChange={(e)=>setTemplateSearch(e.target.value)} placeholder="Search name, subject, or message" /></div>
        <Select label="Show" value={templateFilter} onChange={(e)=>setTemplateFilter(e.target.value as typeof templateFilter)}><option value="all">All templates</option><option value="custom">My templates</option><option value="builtin">Built-in templates</option></Select>
      </div>
      <p className="muted">{templateLibrary.length} matching templates · {data.customTemplates.length} saved by you</p>
      <div className="pharmacy-template-library">
        {templateLibrary.length===0 && <p className="muted">No templates match this search.</p>}
        {templateLibrary.map(([id,t])=>{
          const custom = id.startsWith("custom-")
          const activeRules = data.automationRules.filter((r)=>r.template===id && r.enabled).length + (data.reminderRule.auto && data.reminderRule.template===id?1:0)
          return <div key={id} className="pharmacy-template-item">
            <div><strong>{t.label}</strong><small className="muted">{custom?"My saved template":"Built-in template"} · {activeRules ? activeRules+" active automation rule(s)" : "Manual use only"}</small><p>{t.subject}</p><p className="muted pharmacy-template-excerpt">{t.body}</p></div>
            <div className="pharmacy-template-item-actions">
              <Button variant="secondary" onClick={()=>custom ? editSavedTemplate({id,label:t.label,subject:t.subject,body:t.body}) : (resetTemplateEditor(),setTemplateName(t.label+" (copy)"),setTemplateSubject(t.subject),setTemplateBody(t.body))}>{custom?"Edit":"Make editable copy"}</Button>
              {custom && <Button variant="text" onClick={()=>update((d)=>({...d,customTemplates:d.customTemplates.filter((x)=>x.id!==id),automationRules:d.automationRules.map((r)=>r.template===id?{...r,enabled:false}:r)}))}>Delete</Button>}
            </div>
          </div>
        })}
      </div>
      <div className="pharmacy-template-editor">
        <Heading level={3}>{editingTemplate?"Edit saved template":"Create a template"}</Heading>
        <div className="field"><label htmlFor="pst-name">Template name</label><input id="pst-name" value={templateName} onChange={(e)=>setTemplateName(e.target.value)} placeholder="e.g. Return visit follow-up" /></div>
        <div className="field"><label htmlFor="pst-sub">Email subject</label><input id="pst-sub" value={templateSubject} onChange={(e)=>setTemplateSubject(e.target.value)} /></div>
        <div className="field"><label htmlFor="pst-body">Message body</label><textarea id="pst-body" rows={7} value={templateBody} onChange={(e)=>setTemplateBody(e.target.value)} placeholder="Use {student}, {date}, {time} for personalized fields." /></div>
        <div className="action-row">
          <Button disabled={!templateName.trim()||!templateSubject.trim()||!templateBody.trim()} onClick={()=>{update((d)=>({...d,customTemplates:editingTemplate?d.customTemplates.map((t)=>t.id===editingTemplate?{...t,label:templateName.trim(),subject:templateSubject,body:templateBody}:t):[...d.customTemplates,{id:"custom-"+Date.now(),label:templateName.trim(),subject:templateSubject,body:templateBody}]}));resetTemplateEditor()}}>{editingTemplate?"Save changes":"Save as new template"}</Button>
          {(editingTemplate || templateName || templateSubject || templateBody) && <Button variant="text" onClick={resetTemplateEditor}>Clear editor</Button>}
        </div>
        <p className="muted">Templates are saved locally in this demo. Sending is done in Messages; automatic scheduling is configured separately below.</p>
      </div>
    </Card>
    <Card className="pharmacy-automation-settings pharmacy-settings-section">
        <Heading level={2}>Automatic message rules</Heading>
        <p className="muted">Save each template with its own timing, then edit or toggle it in the list below. State deadline dates must be entered from a verified official source; these are illustrative scheduling preferences, not a legal determination or actual delivery.</p>
        <div className="pharmacy-auto-add">
          <Select label="Template" value={autoTemplate} onChange={(e)=>setAutoTemplate(e.target.value)}>
            {Object.entries(templates).filter(([k])=>k!=="custom").map(([k,t])=><option key={k} value={k}>{t.label}</option>)}
          </Select>
          <Select label="When should it run?" value={autoCadence} onChange={(e)=>setAutoCadence(e.target.value as typeof autoCadence)}>
            <option value="before">Before each appointment</option>
            <option value="after">After each appointment</option>
            <option value="repeat">Repeat every X days (demo only)</option>
            <option value="deadline-before">Before a state deadline</option>
            <option value="deadline-after">After a state deadline</option>
          </Select>
          <Field label={autoCadence==="repeat"?"Repeat every (days)":autoCadence==="before"?"Days before visit":autoCadence==="after"?"Days after visit":autoCadence==="deadline-before"?"Days before state deadline":"Days after state deadline"} type="number" min={autoCadence==="repeat"?1:0} max={365} value={autoDays} onChange={(e)=>setAutoDays(e.target.value)} />
          {legalRule && <div className="pharmacy-deadline-fields">
            <Select label="State" value={deadlineState} onChange={(e)=>setDeadlineState(e.target.value)}>{states.map((v)=><option key={v} value={v}>{v}</option>)}</Select>
            <Field label="Verified state deadline" type="date" value={deadlineDate} onChange={(e)=>setDeadlineDate(e.target.value)} />
            <Field label="Official source URL (required)" type="url" value={deadlineSource} onChange={(e)=>setDeadlineSource(e.target.value)} placeholder="https://..." />
            <p className="muted">Enter a deadline checked against your state's current official requirements. The app does not calculate legal deadlines or determine vaccine eligibility. {deadlinePreview ? "Illustrative rule date: "+dateLabel(deadlinePreview) : ""}</p>
          </div>}
          <Button variant="secondary" disabled={!validDays||!validDeadline} onClick={()=>{
            const extra = legalRule ? {dueDate:deadlineDate,stateCode:deadlineState,sourceUrl:deadlineSource.trim()} : {dueDate:undefined,stateCode:undefined,sourceUrl:undefined}
            update((d)=>({...d,automationRules:editingRule ? d.automationRules.map((r)=>r.id===editingRule?{...r,template:autoTemplate,days:Number(autoDays),cadence:autoCadence,...extra}:r):[...d.automationRules,{id:"auto-"+Date.now(),template:autoTemplate,days:Number(autoDays),enabled:true,cadence:autoCadence,...extra}]}))
            setEditingRule("")
          }}>{editingRule?"Update rule":"Save new rule"}</Button>
        </div>
        {data.automationRules.length===0 ? <p className="muted">No additional rules saved yet.</p> :
          data.automationRules.map((r)=><div key={r.id} className="pharmacy-rule-line pharmacy-rule-row">
            <strong>{templates[r.template]?.label??"Saved template"}</strong><span>{r.cadence==="repeat" ? "Every "+r.days+" days (demo schedule)" : r.cadence.startsWith("deadline-") ? r.days+" days "+(r.cadence==="deadline-before"?"before":"after")+" "+(r.stateCode??"state")+" deadline "+(r.dueDate??"not set") : r.days+" days "+(r.cadence==="after"?"after":"before")+" booked visits"}</span>
            {r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noreferrer">Review saved state source</a>}
            <div className="pharmacy-rule-actions"><Check checked={r.enabled} onChange={(e)=>update((d)=>({...d,automationRules:d.automationRules.map((x)=>x.id===r.id?{...x,enabled:e.target.checked}:x)}))}>Enabled</Check>
            <Button variant="secondary" onClick={()=>{setEditingRule(r.id);setAutoTemplate(r.template);setAutoDays(String(r.days));setAutoCadence(r.cadence);setDeadlineDate(r.dueDate??"");setDeadlineState(r.stateCode??"Oregon");setDeadlineSource(r.sourceUrl??"")}}>Edit</Button>
            <Button variant="text" onClick={()=>update((d)=>({...d,automationRules:d.automationRules.filter((x)=>x.id!==r.id)}))}>Remove</Button></div>
          </div>)}
      {editingRule && <Button variant="text" onClick={()=>setEditingRule("")}>Cancel editing</Button>}
    </Card>
    <Card className="pharmacy-settings-section">
      <Heading level={2}>Publishing & compliance</Heading>
      {changed && <Alert kind="warning">You changed the sample vaccines or ages. Which vaccines and ages a pharmacist may give depends on the state. Check your state's own page before you publish.</Alert>}
      <OfficialSource topic="which vaccines and ages a pharmacist may give" />
      {saved && <Alert kind="success">{saved}</Alert>}
      <div className="action-row"><Button disabled={invalid} onClick={publish}>Publish offerings</Button></div>
    </Card>
    </div>
  )
}

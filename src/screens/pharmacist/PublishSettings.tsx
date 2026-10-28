import { useState } from "react"
import { Alert, Button, Card, Check, Field, Heading, Select } from "../../components/ui"
import OfficialSource from "../../components/OfficialSource"
import { vaccines } from "../../demo/config"
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
  const [autoCadence, setAutoCadence] = useState<"before"|"after"|"repeat">("before")
  const [editingRule, setEditingRule] = useState("")
  const templates = { ...builtInTemplates, ...Object.fromEntries(data.customTemplates.map((t) => [t.id, t])) }
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
      <Heading level={2}>Messaging preferences</Heading>
      <fieldset className="publish-vaccines">
        <legend>Legacy default reminders</legend>
        <div className="controls">
          <Select label="Reminder timing" value={String(data.reminderRule.days)} onChange={(e) => update((d) => ({ ...d, reminderRule: { ...d.reminderRule, days: Number(e.target.value) } }))}>
            {[1, 2, 3, 5, 7, 14].map((n) => <option key={n} value={n}>{n} day{n > 1 ? "s" : ""} before the visit</option>)}
          </Select>
          <Select label="Default message" value={data.reminderRule.template} onChange={(e) => update((d) => ({ ...d, reminderRule: { ...d.reminderRule, template: e.target.value } }))}>
            <option value="reminder">Appointment reminder</option>
            <option value="followup">Next visit follow-up</option>
          </Select>
        </div>
        <Check checked={data.reminderRule.auto} onChange={(e) => update((d) => ({ ...d, reminderRule: { ...d.reminderRule, auto: e.target.checked } }))}>Send visit reminders automatically ({data.reminderRule.days} days before)</Check>
        <Check checked={data.reminderRule.autoNoShow} onChange={(e) => update((d) => ({ ...d, reminderRule: { ...d.reminderRule, autoNoShow: e.target.checked } }))}>Send the missed-visit notice as soon as I mark a no-show</Check>
        <small className="muted">You still mark who came. Timing, template and automation stay saved here across appointments. Demo only: nothing is delivered.</small>
      </fieldset>
    </Card>
    <Card className="pharmacy-automation-settings pharmacy-settings-section">
        <Heading level={2}>Automatic message rules</Heading>
        <p className="muted">Save a template schedule once. Before-visit rules use appointment dates; repeat rules are interval-based demonstrations. Real delivery would require explicit consent, appropriate recipients, and a backend. Nothing is sent.</p>
        <div className="pharmacy-auto-add">
          <Select label="Template" value={autoTemplate} onChange={(e)=>setAutoTemplate(e.target.value)}>
            {Object.entries(templates).filter(([k])=>k!=="custom"&&k!=="noshow").map(([k,t])=><option key={k} value={k}>{t.label}</option>)}
          </Select>
          <Select label="Schedule type" value={autoCadence} onChange={(e)=>setAutoCadence(e.target.value as "before"|"after"|"repeat")}><option value="before">Before each appointment</option><option value="after">After each appointment</option><option value="repeat">Repeat at intervals</option></Select>
          <Select label={autoCadence==="before"?"Days before appointment":autoCadence==="after"?"Days after appointment":"Repeat every (days)"} value={autoDays} onChange={(e)=>setAutoDays(e.target.value)}>
            {[0,1,2,3,5,7,14,30].filter((n)=>autoCadence!=="repeat"||n>0).map((n)=><option key={n} value={n}>{n===0?"Appointment day":autoCadence==="before"?n+" days before":autoCadence==="after"?n+" days after":"Every "+n+" days"}</option>)}
          </Select>
          <Button variant="secondary" onClick={()=>{update((d)=>({...d,automationRules:editingRule ? d.automationRules.map((r)=>r.id===editingRule?{...r,template:autoTemplate,days:Number(autoDays),cadence:autoCadence}:r) : [...d.automationRules,{id:"auto-"+Date.now(),template:autoTemplate,days:Number(autoDays),enabled:true,cadence:autoCadence}]}));setEditingRule("")}}>{editingRule?"Update rule":"Save new rule"}</Button>
        </div>
        {data.automationRules.length===0 ? <p className="muted">No additional rules saved yet.</p> :
          data.automationRules.map((r)=><div key={r.id} className="pharmacy-rule-line">
            <strong>{templates[r.template]?.label??"Saved template"}</strong><span>{r.cadence==="repeat" ? "Every "+r.days+" days (demo schedule)" : r.days+" days "+(r.cadence==="after"?"after":"before")+" booked visits"}</span>
            <Check checked={r.enabled} onChange={(e)=>update((d)=>({...d,automationRules:d.automationRules.map((x)=>x.id===r.id?{...x,enabled:e.target.checked}:x)}))}>Enabled</Check>
            <Button variant="secondary" onClick={()=>{setEditingRule(r.id);setAutoTemplate(r.template);setAutoDays(String(r.days));setAutoCadence(r.cadence)}}>Edit</Button>
            <Button variant="text" onClick={()=>update((d)=>({...d,automationRules:d.automationRules.filter((x)=>x.id!==r.id)}))}>Remove</Button>
          </div>)}
      </Card>
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

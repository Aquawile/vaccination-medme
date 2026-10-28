import { useState } from "react"
import { Alert, Button, Card, Check, Field, Heading, Select } from "../../components/ui"
import OfficialSource from "../../components/OfficialSource"
import { vaccines } from "../../demo/config"
import { effectiveLocation, locations } from "../../demo/journey"
import { useDemo } from "../../state"

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
    <Card>
      <Heading level={2}>Publish what you offer</Heading>
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
      <fieldset className="publish-vaccines">
        <legend>Short on supply right now</legend>
        {vaccines.map((v) => (
          <Check key={v.id} checked={data.shortSupply.includes(v.id)} onChange={(e) => update((d) => ({ ...d, shortSupply: e.target.checked ? [...d.shortSupply, v.id] : d.shortSupply.filter((x) => x !== v.id) }))}>{v.name}</Check>
        ))}
        <small className="muted">Fills the {"{short}"} field when you message families.</small>
      </fieldset>
      {changed && <Alert kind="warning">You changed the sample vaccines or ages. Which vaccines and ages a pharmacist may give depends on the state. Check your state's own page before you publish.</Alert>}
      <OfficialSource topic="which vaccines and ages a pharmacist may give" />
      {saved && <Alert kind="success">{saved}</Alert>}
      <div className="action-row"><Button disabled={invalid} onClick={publish}>Publish</Button></div>
    </Card>
  )
}

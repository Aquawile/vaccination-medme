import { useState } from "react"
import { Alert, Badge, Button, Card, Check, Heading, Select } from "../../components/ui"
import officialLinks from "../../data/officialLinks.json"
import { stateName, usStates } from "../../data/states"
import { defaults } from "../../demo/config"
import { daysUntil, keyDatesFor } from "../../domain/keyDates"
import { useDemo } from "../../state"

/** The school's state is set once. The laws and dates that apply follow from it. */
export default function SchoolSettings() {
  const { data, update, event } = useDemo()
  const [pending, setPending] = useState(data.schoolState)
  const [sure, setSure] = useState(false)
  const [saved, setSaved] = useState(false)
  const links = officialLinks.filter((l) => l.state === data.schoolState)
  const dates = keyDatesFor(data.schoolState, defaults.referenceDate)
  function save() {
    update((d) => ({ ...d, schoolState: pending }))
    event(`School state set to ${stateName(pending)}`, "settings")
    setSaved(true)
    setSure(false)
  }
  return (
    <>
      <Card>
        <div className="section-heading">
          <div>
            <Heading level={2}>School</Heading>
            <p className="muted">{defaults.school} is set to one state. Its rules, dates and reports follow that state.</p>
          </div>
          <Badge>{stateName(data.schoolState)}</Badge>
        </div>
        <div className="controls">
          <Select label="State this school is in" value={pending} onChange={(e) => { setPending(e.target.value); setSaved(false); setSure(false) }}>
            {usStates.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </Select>
        </div>
        {pending !== data.schoolState && (
          <>
            <Alert kind="warning">Changing the state changes which requirements apply to every student and every report. Do this only if the school's state was entered wrong.</Alert>
            <Check checked={sure} onChange={(e) => setSure(e.target.checked)}>I understand this changes every report.</Check>
            <div className="action-row"><Button disabled={!sure} onClick={save}>Change state to {stateName(pending)}</Button></div>
          </>
        )}
        {saved && <Alert kind="success">Saved. The school is now set to {stateName(data.schoolState)}.</Alert>}
      </Card>
      <Card style={{ marginTop: "var(--space-5)" }}>
        <Heading level={2}>Read the law at its source</Heading>
        <p className="muted">MedMe does not summarize state law. These are the state's own pages.</p>
        {links.length === 0 ? (
          <p>No official page on file for {stateName(data.schoolState)} yet. Check with the state health department.</p>
        ) : (
          <ul className="link-list">{links.map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noreferrer">{l.label}</a></li>)}</ul>
        )}
        {dates.upcoming.length > 0 && (
          <>
            <Heading level={3}>Dates on file</Heading>
            <ul className="link-list">
              {dates.upcoming.map((d) => (
                <li key={d.id}>{d.label}: <strong>{d.date}</strong> ({daysUntil(d.date!, defaults.referenceDate)} days) · <a href={d.sourceUrl} target="_blank" rel="noreferrer">source</a> · unverified, confirm at the source</li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  )
}

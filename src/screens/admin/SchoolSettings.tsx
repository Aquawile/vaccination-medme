import { useState } from "react"
import { Alert, Badge, Button, Card, Check, Field, Heading, Select } from "../../components/ui"
import officialLinks from "../../data/officialLinks.json"
import { stateName, usStates } from "../../data/states"
import { defaults } from "../../demo/config"
import { useDemo } from "../../state"

const reasons = ["Entered wrong at setup", "School moved to a new campus", "District reassigned the school"]

/** The school's state is set once. Changing it is deliberate: it needs a reason, the school's name, and the admin's password. */
export default function SchoolSettings() {
  const { data, update, event } = useDemo()
  const [open, setOpen] = useState(false)
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

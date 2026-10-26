import { useState, type FormEvent } from "react"
import { Alert, Badge, Button, Card, Field, Heading, Select } from "../../components/ui"
import { stateName } from "../../data/states"
import { defaults } from "../../demo/config"
import { validateReview } from "../../domain/report"
import { allStateRules } from "../../domain/rules.data"
import { useDemo } from "../../state"

/** Review one state's rule: a rule can only be marked verified with a source link and a reviewer date. */
export default function RuleReview() {
  const { data, update } = useDemo()
  const today = defaults.referenceDate
  const [state, setState] = useState(allStateRules[0].state)
  const base = allStateRules.find((r) => r.state === state)!
  const saved = data.ruleReviews[state]
  const [status, setStatus] = useState(saved?.status ?? base.status)
  const [sourceUrl, setSourceUrl] = useState(saved?.sourceUrl ?? base.sourceUrl)
  const [lastReviewed, setLastReviewed] = useState(saved?.lastReviewed ?? base.lastReviewed)
  const [errors, setErrors] = useState<string[]>([])
  const [done, setDone] = useState(false)
  function pick(code: string) {
    const r = allStateRules.find((x) => x.state === code)!
    const s = data.ruleReviews[code]
    setState(code)
    setStatus(s?.status ?? r.status)
    setSourceUrl(s?.sourceUrl ?? r.sourceUrl)
    setLastReviewed(s?.lastReviewed ?? r.lastReviewed)
    setErrors([])
    setDone(false)
  }
  function save(e: FormEvent) {
    e.preventDefault()
    const found = validateReview({ status, sourceUrl, lastReviewed }, today)
    setErrors(found)
    setDone(false)
    if (found.length) return
    update((d) => ({
      ...d,
      ruleReviews: { ...d.ruleReviews, [state]: { status, sourceUrl: sourceUrl.trim(), lastReviewed } },
      ruleLog: [{ time: today, state, text: `${stateName(state)} set to ${status}` }, ...d.ruleLog],
    }))
    setDone(true)
  }
  return (
    <Card style={{ marginBottom: "var(--space-6)" }}>
      <div className="section-heading">
        <div>
          <Heading level={2}>Review a state rule</Heading>
          <p className="muted">Mark a rule verified only after reading it on the official page. Saved on this device, and every change is logged.</p>
        </div>
        <Badge kind="warning">Demo</Badge>
      </div>
      <form onSubmit={save} noValidate>
        <Select label="State" value={state} onChange={(e) => pick(e.target.value)}>
          {allStateRules.map((r) => <option key={r.state} value={r.state}>{stateName(r.state)}</option>)}
        </Select>
        <Select label="Status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setDone(false) }}>
          <option value="unverified">Unverified</option>
          <option value="read-on-official-page">Read on the official page (verified)</option>
          <option value="not-researched">Not researched</option>
        </Select>
        <Field label="Source link" value={sourceUrl} onChange={(e) => { setSourceUrl(e.target.value); setDone(false) }} placeholder="https://" />
        <Field label="Reviewer date" value={lastReviewed} onChange={(e) => { setLastReviewed(e.target.value); setDone(false) }} placeholder="YYYY-MM-DD" />
        {errors.length > 0 && <Alert kind="error">{errors.join(" ")}</Alert>}
        {done && <Alert kind="success">Saved. The change is in the log below.</Alert>}
        <div className="form-actions"><span>The app reads these rules from data files; this saves a review note in the demo.</span><Button type="submit">Save review</Button></div>
      </form>
      {data.ruleLog.length > 0 && (
        <div className="table-scroll">
          <table>
            <thead><tr><th>Date</th><th>State</th><th>Change</th></tr></thead>
            <tbody>{data.ruleLog.slice(0, 10).map((l, i) => <tr key={i}><td>{l.time}</td><td>{stateName(l.state)}</td><td>{l.text}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

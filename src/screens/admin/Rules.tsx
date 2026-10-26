import { useState, type FormEvent } from "react"
import { Alert, Badge, Button, Card, Field, Heading, Icon, Select } from "../../components/ui"
import { states } from "../../demo/config"
import { allStateRules } from "../../domain/rules.data"
import { stateName } from "../../data/states"
import { useDemo } from "../../state"
import RuleReview from "./RuleReview"

export default function Rules({ active }: { active: boolean }) {
  const { data, update, event } = useDemo()
  const [rules, setRules] = useState(data.rules)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [state, setState] = useState("Oregon")
  function save(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (rules.some((r) => !r.requirement.trim() || !r.source.trim())) return
    update((d) => ({ ...d, rules }))
    event("Sample campaign rules updated", "rule")
    setSaved(true)
  }
  return (
    <>
      <RuleReview />
      <Card className="rule-list" style={{ marginBottom: "var(--space-6)" }}>
        <div className="section-heading">
          <div>
            <Heading level={2}>State pharmacist rules on file</Heading>
            <p className="muted">Every state not listed here shows "No rules on file, check with the state health department."</p>
          </div>
          <Badge kind="warning">Unverified</Badge>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>State</th><th>What we have</th><th>Status</th></tr></thead>
            <tbody>
              {allStateRules.map((r) => (
                <tr key={r.state}>
                  <td><strong>{stateName(r.state)}</strong></td>
                  <td>{r.notes}</td>
                  <td>
                    <Badge kind={(data.ruleReviews[r.state]?.status ?? r.status) === "read-on-official-page" ? "success" : "warning"}>{(data.ruleReviews[r.state]?.status ?? r.status) === "unverified" ? "Unverified" : (data.ruleReviews[r.state]?.status ?? r.status)}</Badge>
                    <p>{(data.ruleReviews[r.state]?.sourceUrl ?? r.sourceUrl) || "Source link still needed"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    <Card>
      <div className="section-heading">
        <div>
          <Heading level={2}>Sample rules</Heading>
          <p className="muted">Sample rules — verify with state source.</p>
        </div>
        <Badge kind="warning">Unverified</Badge>
      </div>
      <Select
        label="State source to verify"
        value={state}
        onChange={(e) => {
          const nextState = e.target.value
          setState(nextState)
          setRules((current) =>
            current.map((rule) => ({
              ...rule,
              source: rule.source.includes("Placeholder")
                ? `Placeholder — ${nextState} state source needed`
                : rule.source,
            })),
          )
          setSaved(false)
        }}
      >
        {states.map((name) => <option key={name}>{name}</option>)}
      </Select>
      <Alert>
        Rules are shown as editable demo placeholders for all 50 states. Verify requirements against the {state} health department before using this workflow.
      </Alert>
      {!active ? (
        <div className="empty-state">
          <p>No sample rules configured for this campaign.</p>
        </div>
      ) : (
        <form onSubmit={save} noValidate>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Vaccine</th>
                  <th>Sample requirement</th>
                  <th>Source</th>
                  <th>Verification status</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r, i) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.vaccine}</strong>
                    </td>
                    <td>
                      <Field
                        label={`${r.vaccine} requirement`}
                        value={r.requirement}
                        onChange={(e) => {
                          setSaved(false)
                          setRules(
                            rules.map((x, j) =>
                              j === i
                                ? { ...x, requirement: e.target.value }
                                : x,
                            ),
                          )
                        }}
                        error={
                          submitted && !r.requirement.trim()
                            ? "Required"
                            : undefined
                        }
                      />
                    </td>
                    <td>
                      <Field
                        label={`${r.vaccine} source`}
                        value={r.source}
                        onChange={(e) => {
                          setSaved(false)
                          setRules(
                            rules.map((x, j) =>
                              j === i
                                ? { ...x, source: e.target.value }
                                : x,
                            ),
                          )
                        }}
                        error={
                          submitted && !r.source.trim()
                            ? "Source required"
                            : undefined
                        }
                      />
                    </td>
                    <td>
                      <Select
                        label={`${r.vaccine} verification status`}
                        value={r.status}
                        onChange={(e) => {
                          setSaved(false)
                          setRules(
                            rules.map((x, j) =>
                              j === i
                                ? { ...x, status: e.target.value }
                                : x,
                            ),
                          )
                        }}
                      >
                        <option>Unverified</option>
                        <option>Awaiting review</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <span>Demo edits never imply clinical verification.</span>
            <Button type="submit">
              Save rules
              <Icon name="check" size={17} />
            </Button>
          </div>
          {saved && (
            <Alert kind="success">Sample rules saved on this device.</Alert>
          )}
        </form>
      )}
    </Card>
    </>
  )
}

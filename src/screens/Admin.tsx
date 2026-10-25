import { useState, type FormEvent } from "react"
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Heading,
  Icon,
  Select,
  Check,
} from "../components/ui"
import { defaults, states } from "../demo/config"
import { useDemo } from "../state"
import { appointmentStatus, dateLabel, locations } from "../demo/journey"
export default function Admin() {
  const { data, update, event } = useDemo()
  const [campaign, setCampaign] = useState("fall")
  const [rules, setRules] = useState(data.rules)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [state, setState] = useState("Oregon")
  const [openMetric, setOpenMetric] = useState("")
  const [studentQuery, setStudentQuery] = useState("")
  const active = campaign === "fall"
  const appointments = data.appointments.filter((a) => a.campaign === campaign)
  const generated = appointments.filter((a) => !a.seeded)
  const allChildren = data.appointments
    .map((a) => a.child)
    .filter(
      (child, index, list) =>
        list.findIndex((x) => x.name === child.name && x.birthDate === child.birthDate) === index,
    )
  const matchingChildren = allChildren.filter((child) =>
    `${child.name} ${child.school}`.toLowerCase().includes(studentQuery.toLowerCase()),
  )
  const metrics: [string, number][] = [
    ["Scans", data.events.filter((e) => e.type === "scan").length],
    ["Profiles created", data.childSaved ? 1 : 0],
    ["Bookings", generated.length],
    [
      "Completed appointments",
      generated.filter((a) => a.doses.length === a.vaccines.length).length,
    ],
    [
      "Reported doses",
      generated.reduce(
        (n, a) => n + a.doses.filter((d) => d.reported).length,
        0,
      ),
    ],
  ]
  function save(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (rules.some((r) => !r.requirement.trim() || !r.source.trim())) return
    update((d) => ({ ...d, rules }))
    event("Sample campaign rules updated", "rule")
    setSaved(true)
  }
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="eyebrow">ADMINISTRATION</div>
        <div className="sidebar-item">
          <Icon name="grid" />
          Campaign overview
        </div>
        <div className="sidebar-note">
          <Icon name="info" />
          <p>
            End-to-end prototype
            <br />
            <span>Local data, clearly labeled.</span>
          </p>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-title">
          <div className="page-heading">
            <div className="eyebrow">A SHARED VIEW OF PROGRESS</div>
            <Heading>Campaign overview</Heading>
            <p>A clear view of activity, from first scan to reported dose.</p>
          </div>
          <Select
            label="Campaign"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
          >
            <option value="fall">{defaults.campaign}</option>
            <option value="spring">Fern Valley · Spring 2027</option>
          </Select>
        </div>
        <Alert>
          Activity starts at zero. The funnel counts generated demo activity,
          not the seeded example. Bookings include cancelled visits; appointment
          and dose counts are distinct.
        </Alert>
        <div className="metrics">
          {metrics.map(([label, value]) => (
            <Card
              key={label}
              className={`metric-card ${openMetric === label ? "expanded" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => setOpenMetric(openMetric === label ? "" : label)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setOpenMetric(openMetric === label ? "" : label)
              }}
            >
              <span>{label}</span>
              <strong>{active ? value : 0}</strong>
              <small>
                {label === "Scans"
                  ? "Notice opens · Simulated scans"
                  : "Generated demo activity"}
              </small>
              {openMetric === label && (
                <p className="metric-detail">
                  {label === "Reported doses"
                    ? "Counts only saved doses acknowledged by the simulated reporting service."
                    : label === "Completed appointments"
                      ? "A visit is complete when every selected dose has been saved."
                      : "Click any metric card to collapse this explanation."}
                </p>
              )}
            </Card>
          ))}
        </div>
        <div className="admin-overview-grid">
          <Card className="tracker-card">
            <div className="section-heading">
              <div>
                <Heading level={2}>Vaccination tracker</Heading>
                <p className="muted">How many selected doses are saved for this campaign.</p>
              </div>
              <Badge kind="success">
                {generated.reduce((n, a) => n + a.doses.length, 0)} saved
              </Badge>
            </div>
            {["dtap", "polio"].map((id) => {
              const total = generated.filter((a) => a.vaccines.includes(id)).length
              const saved = generated.reduce(
                (n, a) => n + a.doses.filter((d) => d.vaccine === id).length,
                0,
              )
              return (
                <div className="tracker-row" key={id}>
                  <span>{id === "dtap" ? "DTaP" : "IPV"}</span>
                  <div className="tracker-bar"><i style={{ width: `${total ? Math.min(100, (saved / total) * 100) : 0}%` }} /></div>
                  <strong>{saved}/{total}</strong>
                </div>
              )
            })}
            <p className="inline-note">Seeded examples are intentionally excluded from campaign progress.</p>
          </Card>
          <Card className="lookup-card">
            <div className="section-heading">
              <div>
                <Heading level={2}>Find a student</Heading>
                <p className="muted">Search locally stored demo records by name or school.</p>
              </div>
              <Icon name="user" size={18} />
            </div>
            <Field label="Student lookup" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Search Sam Parker" />
            {studentQuery && matchingChildren.length === 0 && <p className="muted">No demo student matches that search.</p>}
            {studentQuery && matchingChildren.map((child) => (
              <div className="lookup-result" key={`${child.name}-${child.birthDate}`}>
                <span className="avatar">{child.name[0]}</span>
                <div><strong>{child.name}</strong><small>{child.school} · Grade {child.grade}</small></div>
                <Badge>{data.appointments.find((a) => a.child.name === child.name)?.doses.length || 0} doses</Badge>
              </div>
            ))}
          </Card>
        </div>
        <div className="metrics secondary-metrics">
          {[
            [
              "Administered doses",
              generated.reduce((n, a) => n + a.doses.length, 0),
            ],
            ["Proof created", generated.filter((a) => a.proofCreated).length],
            [
              "Proof shared / copied",
              generated.filter((a) => a.proofShared).length,
            ],
            [
              "School accepted",
              generated.filter((a) => a.schoolAccepted).length,
            ],
            [
              "Cancelled appointments",
              generated.filter((a) => a.cancelled).length,
            ],
          ].map(([label, value]) => (
            <Card key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>Generated demo activity</small>
            </Card>
          ))}
        </div>
        <Card className="admin-appointment-table">
          <div className="section-heading">
            <div>
              <Heading level={2}>Appointments and outcomes</Heading>
              <p className="muted">
                School acceptance is recorded separately, only after a demo
                proof has been shared.
              </p>
            </div>
            <Badge>{appointments.length} appointments</Badge>
          </div>
          {appointments.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Child / visit</th>
                    <th>Location / status</th>
                    <th>Doses</th>
                    <th>Proof</th>
                    <th>School acceptance</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.child.name}</strong>
                        <p>
                          {dateLabel(a.date)} · {a.time}
                        </p>
                        <Badge>
                          {a.seeded ? "Seeded example" : "Parent booking"}
                        </Badge>
                      </td>
                      <td>
                        {locations.find((p) => p.id === a.locationId)?.name}
                        <p>{appointmentStatus(a)}</p>
                      </td>
                      <td>
                        {a.doses.length} saved / {a.vaccines.length} selected
                        <br />
                        {a.doses.filter((d) => d.reported).length} reported
                      </td>
                      <td>
                        {a.proofCreated ? "Created" : "Not created"}
                        <br />
                        {a.proofShared ? "Shared / copied" : "Not shared"}
                      </td>
                      <td>
                        <Check
                          checked={a.schoolAccepted}
                          disabled={
                            !a.proofShared ||
                            a.doses.length !== a.vaccines.length
                          }
                          onChange={(e) => {
                            const accepted = e.target.checked
                            update((d) => ({
                              ...d,
                              appointments: d.appointments.map((x) =>
                                x.id === a.id
                                  ? { ...x, schoolAccepted: accepted }
                                  : x,
                              ),
                            }))
                            event(
                              `${
                                a.seeded ? "Seeded example: " : ""
                              }Demo school acceptance ${
                                accepted ? "recorded" : "removed"
                              } for ${a.child.name}`,
                              "school",
                            )
                          }}
                        >
                          Demo accepted
                        </Check>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No appointments in this campaign.</p>
            </div>
          )}
        </Card>
        <Card className="scenario-card">
          <Heading level={2}>Demo scenario controls</Heading>
          <p className="muted">
            Editable fake service responses. These do not connect to a real
            registry, insurer or clinical rules engine.
          </p>
          <div className="scenario-grid">
            {[
              {
                key: "registry",
                label: "Registry lookup",
                options: [
                  ["available", "Sample record available"],
                  ["unavailable", "Record unavailable"],
                ],
              },
              {
                key: "insurance",
                label: "Insurance service",
                options: [
                  ["normal", "Return chosen sample response"],
                  ["unavailable", "Service unavailable · Cost unknown"],
                ],
              },
              {
                key: "reporting",
                label: "Registry reporting",
                options: [
                  ["success", "Simulated acknowledgement"],
                  ["failure", "Simulated failure · Export fallback"],
                ],
              },
              {
                key: "slots",
                label: "Appointment availability",
                options: [
                  ["available", "Sample slots available"],
                  ["unavailable", "No sample slots"],
                ],
              },
              {
                key: "prescription",
                label: "Sample prescription response",
                options: [
                  ["available", "Sample authorization available"],
                  ["unavailable", "Unavailable · Clinician referral"],
                ],
              },
            ].map((control) => (
              <Select
                key={control.key}
                label={control.label}
                value={
                  data.scenario[(control.key as keyof typeof data.scenario)]
                }
                onChange={(e) => {
                  const value = e.target.value
                  update((d) => ({
                    ...d,
                    scenario: { ...d.scenario, [control.key]: value },
                  }))
                  event(`${control.label} scenario updated`, "scenario")
                }}
              >
                {control.options.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            ))}
            <Select
              label="Parent record scenario"
              value={data.record.state}
              onChange={(e) => {
                const value = e.target.value as typeof data.record.state
                update((d) => ({
                  ...d,
                  record: { ...d.record, state: value },
                  selection: value === "complete" ? [] : d.selection,
                }))
                event("Parent sample record state updated", "scenario")
              }}
            >
              <option value="sample">
                Sample doses not documented complete
              </option>
              <option value="unavailable">Record unavailable</option>
              <option value="awaiting">Record awaiting review</option>
              <option value="complete">Sample requirements complete</option>
            </Select>
          </div>
          <Alert>
            Scenario changes affect future simulated responses, not already
            signed doses or historical confirmed prices. Requirements complete
            is a sample scenario, not a clinical verification.
          </Alert>
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
      </main>
    </div>
  )
}

import { Alert, Button, Card, Heading, Select } from "../components/ui"
import { useDemo } from "../state"

/** Archived demo scenario controls. Reached at #dev, used by tests and the presenter. */
export default function Dev() {
  const { data, update, event } = useDemo()
  return (
    <main className="admin-main">
      <Button variant="text" onClick={() => { window.location.hash = "" }}>Back to the app</Button>
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
    </main>
  )
}

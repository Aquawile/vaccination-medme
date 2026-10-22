import { useState } from "react"
import { Alert, Button, Card, Field, Heading, Select } from "./ui"
import { useDemo } from "../state"
import { simulatedRequest } from "../demo/services"
import { defaults } from "../demo/config"
import { dateLabel } from "../demo/journey"
export default function RecordPanel() {
  const { data, update, event } = useDemo()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [vaccine, setVaccine] = useState("DTaP")
  const [date, setDate] = useState("")
  const [manual, setManual] = useState("")
  async function retrieve() {
    setBusy(true)
    setMessage("")
    const available = await simulatedRequest(
      data.scenario.registry === "available",
    )
    update((d) => ({
      ...d,
      record: {
        ...d.record,
        state: available ? "sample" : "unavailable",
        source: available
          ? "Simulated registry lookup — seeded extract"
          : "Simulated registry — unavailable",
        retrieved: dateLabel(defaults.referenceDate),
      },
    }))
    event(
      available ? "Sample record retrieved" : "Record lookup unavailable",
      "record",
    )
    setMessage(
      available
        ? "Sample extract retrieved. Clinical review is still required."
        : "No record was returned. This does not mean no vaccines were given. Add a record for review or continue to a clinician.",
    )
    setBusy(false)
  }
  return (
    <Card className="record-panel">
      <Heading level={2}>Vaccination records</Heading>
      <p className="muted">
        Choose a record source. Nothing here automatically verifies a vaccine
        history.
      </p>
      <div className="action-row">
        <Button variant="secondary" onClick={retrieve} disabled={busy}>
          {busy ? "Retrieving sample…" : "Retrieve sample registry record"}
        </Button>
      </div>
      <details>
        <summary>Add a manual record for review</summary>
        <div className="form-grid">
          <Select
            label="Vaccine listed on record"
            value={vaccine}
            onChange={(e) => setVaccine(e.target.value)}
          >
            <option>DTaP</option>
            <option>IPV</option>
            <option>Other / unsure</option>
          </Select>
          <Field
            label="Date listed on record"
            type="date"
            max={defaults.referenceDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Field
          label="Record source or notes"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="For example, a fictional clinic record"
        />
        <Button
          variant="secondary"
          onClick={() => {
            if (!date || date > defaults.referenceDate || !manual.trim()) {
              setMessage(
                "Enter a record date on or before the demo reference date and a source.",
              )
              return
            }
            update((d) => ({
              ...d,
              record: {
                ...d.record,
                state: "awaiting",
                source: "Parent-entered record — unverified",
                manual: `${vaccine} · ${date} · ${manual.trim()}`,
                retrieved: dateLabel(defaults.referenceDate),
              },
            }))
            event("Manual record saved for review", "record")
            setMessage(
              "Manual record saved for clinician review. Requirements have not been automatically marked complete.",
            )
          }}
        >
          Save manual record
        </Button>
      </details>
      <details>
        <summary>Attach a record photo</summary>
        <Field
          label="Record image (PNG or JPEG, up to 5 MB)"
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            if (
              !["image/png", "image/jpeg"].includes(file.type) ||
              file.size > 5 * 1024 * 1024
            ) {
              setMessage("Choose a PNG or JPEG image no larger than 5 MB.")
              return
            }
            update((d) => ({
              ...d,
              record: {
                ...d.record,
                state: "awaiting",
                source: "Photo attachment — awaiting review",
                attachment: file.name,
                retrieved: dateLabel(defaults.referenceDate),
              },
            }))
            event("Record photo metadata saved for review", "record")
            setMessage(
              "Photo filename saved locally. The image is not uploaded, read, interpreted or verified; keep the original to show the clinician.",
            )
          }}
        />
        <p className="inline-note">
          Only the filename is retained in this demo, not image contents.
        </p>
      </details>
      {data.record.manual && (
        <p className="record-note">Manual entry: {data.record.manual}</p>
      )}
      {data.record.attachment && (
        <p className="record-note">
          Attachment: {data.record.attachment} · Awaiting review
        </p>
      )}
      {message && <Alert>{message}</Alert>}
    </Card>
  )
}

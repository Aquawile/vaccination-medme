import { useState } from "react"
import { Alert, Badge, Button, Card, Heading, Icon } from "./ui"
import { createProofPdf, downloadBlob, proofLines } from "../demo/documents"
import { dateLabel, type Appointment } from "../demo/journey"
import { vaccines } from "../demo/config"
import { useDemo } from "../state"
import OfficialSource from "./OfficialSource"
import { nextDoseDate } from "../domain/nextDose"
export default function Proof({ appointment }: { appointment: Appointment }) {
  const { data, update, event } = useDemo()
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const a = appointment
  const mark = (shared = false) =>
    update((d) => ({
      ...d,
      appointments: d.appointments.map((x) =>
        x.id === a.id
          ? { ...x, proofCreated: true, proofShared: shared || x.proofShared }
          : x,
      ),
    }))
  function download() {
    downloadBlob(createProofPdf(a), `${a.id}-demo-proof.pdf`)
    mark()
    event(`Demo proof PDF created for ${a.child.name}`, "proof")
    setMessage(
      "Demo PDF downloaded. School acceptance and registry reporting have not changed.",
    )
  }
  async function share() {
    setBusy(true)
    setMessage("")
    try {
      const file = new File([createProofPdf(a)], `${a.id}-demo-proof.pdf`, {
        type: "application/pdf",
      })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Demo vaccination summary",
          files: [file],
        })
        mark(true)
        event("Demo proof shared using device share", "share")
        setMessage(
          "Device share completed. This does not confirm receipt or school acceptance.",
        )
      } else {
        await navigator.clipboard.writeText(proofLines(a).join("\n"))
        mark(true)
        event("Demo proof copied for sharing", "share")
        setMessage(
          "Demo summary copied to clipboard. Nothing was sent automatically; school acceptance remains separate.",
        )
      }
    } catch (error) {
      setMessage(
        (error as Error).name === "AbortError"
          ? "Sharing cancelled. No share was recorded."
          : "Sharing is unavailable in this browser. Download the PDF and share it yourself; no share has been recorded.",
      )
    } finally {
      setBusy(false)
    }
  }
  if (!a.doses.length)
    return (
      <Alert>
        Proof becomes available after a clinician saves an administered dose.
        Selected vaccines are not proof of vaccination.
      </Alert>
    )
  return (
    <Card className="proof-card">
      <div className="section-heading">
        <div>
          <div className="eyebrow">SAVED ADMINISTERED DOSES</div>
          <Heading level={2}>Vaccination summary</Heading>
        </div>
        <Badge>Demo proof only</Badge>
      </div>
      <p className="muted">
        {a.child.name} · {dateLabel(a.date)} · {a.id}
      </p>
      <div className="proof-doses">
        {a.doses.map((d) => (
          <div key={d.id}>
            <Icon name="check" />
            <div>
              <strong>{vaccines.find((v) => v.id === d.vaccine)?.name}</strong>
              <p>
                {dateLabel(d.date)} at {d.time} · Lot {d.lot}
                <br />
                {d.site} · Recorded by {d.signature}
              </p>
            </div>
          </div>
        ))}
      </div>
      {a.doses.length < a.vaccines.length && (
        <Alert>
          This is a partial summary: {a.doses.length} of {a.vaccines.length}{" "}
          selected doses were saved. It does not claim the other doses were
          administered.
        </Alert>
      )}
      <div className="status-grid">
        <div>
          <small>Proof created</small>
          <strong>{a.proofCreated ? "Yes · Local demo" : "Not yet"}</strong>
        </div>
        <div>
          <small>Proof shared</small>
          <strong>{a.proofShared ? "Device share / copied" : "Not yet"}</strong>
        </div>
        <div>
          <small>Registry reported</small>
          <strong>
            {a.doses.filter((d) => d.reported).length} of {a.doses.length} ·
            Simulated
          </strong>
        </div>
        <div>
          <small>School accepted</small>
          <strong>
            {a.schoolAccepted ? "Demo acceptance recorded" : "Not confirmed"}
          </strong>
        </div>
      </div>
      <div className="action-row">
        <Button onClick={download}>
          <Icon name="document" size={17} />
          Download demo PDF
        </Button>
        <Button variant="secondary" onClick={share} disabled={busy}>
          {busy ? "Opening share…" : "Share demo summary"}
        </Button>
      </div>
      <div className="share-link">
        <small>Next-dose reminder</small>
        {a.doses.map((d) => {
          const due = nextDoseDate(d.vaccine, d.date)
          const name = vaccines.find((v) => v.id === d.vaccine)?.name
          const set = data.reminders.some((r) => r.id === d.id)
          return due ? (
            <div key={d.id} className="action-row" style={{ margin: 0, alignItems: "center" }}>
              <span>{name}: earliest date by the sample interval table is {dateLabel(due)}.</span>
              <Button variant="secondary" disabled={set} onClick={() => { update((s) => ({ ...s, reminders: [...s.reminders, { id: d.id, vaccine: name ?? d.vaccine, dueDate: due, child: a.child.name }] })); event(`Next-dose reminder set for ${name}`, "reminder") }}>{set ? "Reminder set" : "Remind me"}</Button>
            </div>
          ) : null
        })}
        <p className="muted">Sample interval table, unverified. This is not a recommendation. Your child's pharmacist or doctor decides whether another dose is needed.</p>
      </div>
      <div className="share-link">
        <small>Share link (demo)</small>
        <code>https://school-demo.example/proof/{a.id}</code>
        <p className="muted">A real link would open a read-only summary for the school. This one goes nowhere.</p>
      </div>
      <p className="muted">Recorded by {[...new Set(a.doses.map((d) => d.signature))].join(", ")}.</p>
      <OfficialSource topic="what a school accepts as proof" />
      {message && <Alert>{message}</Alert>}
      <p className="inline-note">
        Not valid medical proof. No real school or registry receives this data.
      </p>
    </Card>
  )
}

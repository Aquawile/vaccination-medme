import { useRef, useState, type FormEvent } from "react"
import OfficialSource from "../components/OfficialSource"
import entrySources from "../data/entrySources.json"
import {
  Alert,
  Badge,
  Button,
  Card,
  Check,
  Field,
  Heading,
  Icon,
  Select,
} from "../components/ui"
import Proof from "../components/Proof"
import { vaccines } from "../demo/config"
import {
  ageAt,
  appointmentStatus,
  dateLabel,
  locations,
  money,
  reviewItems,
  type Appointment,
} from "../demo/journey"
import { saveDose, simulatedRequest } from "../demo/services"
import { exportDoses } from "../demo/documents"
import { useDemo } from "../state"
export default function Pharmacist() {
  const { data, update, event } = useDemo()
  const [selected, setSelected] = useState(
    data.appointments.find((a) => !a.seeded && !a.cancelled)?.id || "DEMO-001",
  )
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const appointments = data.appointments
    .filter(
      (a) =>
        (filter === "all" || a.locationId === filter) &&
        `${a.child.name} ${a.child.school}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice()
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
  const appointment = data.appointments.find((a) => a.id === selected)
  return (
    <main className="staff-main">
      <div className="page-heading">
        <div className="eyebrow">LOCAL DEMO · CLINICIAN WORKSPACE</div>
        <Heading>Your appointments</Heading>
        <p>
          Booked visits and seeded examples. Review first, then record each
          administered dose once.
        </p>
      </div>
      <div className="schedule-layout">
        <Card className="schedule">
          <div className="section-heading">
            <Heading level={2}>Schedule</Heading>
            <Badge>{appointments.length}</Badge>
          </div>
          <Select
            label="Location"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              const next = data.appointments.find(
                (a) =>
                  e.target.value === "all" || a.locationId === e.target.value,
              )
              if (next) setSelected(next.id)
            }}
          >
            <option value="all">All demo locations</option>
            {locations.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Field
            label="Find a student"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or school"
          />
          {appointments.map((a) => (
            <Button
              key={a.id}
              variant={
                a.id === selected ? "appointment selected" : "appointment"
              }
              onClick={() => setSelected(a.id)}
            >
              <span className="appointment-time">
                {a.time}
                <span>{a.date.slice(5)}</span>
              </span>
              <span>
                <strong>{a.child.name}</strong>
                <span>
                  {a.vaccines.length} selected vaccine
                  {a.vaccines.length > 1 ? "s" : ""}
                </span>
                <Badge
                  kind={appointmentStatus(a) === "Completed" ? "success" : ""}
                >
                  {appointmentStatus(a)}
                </Badge>
                <small>{a.seeded ? "Seeded example" : "Parent booking"}</small>
              </span>
            </Button>
          ))}
          {!appointments.length && (
            <p className="muted">No appointments at this location.</p>
          )}
        </Card>
        {appointment && appointments.some((a) => a.id === appointment.id) ? (
          <AppointmentDetails key={appointment.id} appointment={appointment} />
        ) : (
          <Card>
            <Heading level={2}>Choose an appointment</Heading>
            <p className="muted">Select a visit from the schedule.</p>
          </Card>
        )}
      </div>
    </main>
  )
}
function AppointmentDetails({ appointment: a }: { appointment: Appointment }) {
  const { data, update, event } = useDemo()
  const next = a.vaccines.find((id) => !a.doses.some((d) => d.vaccine === id))
  const [vaccine, setVaccine] = useState(next || a.vaccines[0])
  const [lot, setLot] = useState("")
  const [site, setSite] = useState("")
  const [time, setTime] = useState(a.time)
  const [signature, setSignature] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState("")
  const [followUpDate, setFollowUpDate] = useState(a.followUpDate || "")
  const [followUpNote, setFollowUpNote] = useState(a.followUpNote || "")
  const dialogRef = useRef<HTMLDialogElement>(null)
  const location = locations.find((p) => p.id === a.locationId)
  const provider = location?.providers.find((p) => p.id === a.providerId)
  const completed = a.doses.length === a.vaccines.length
  const inactive = !!a.referral || a.cancelled
  function patch(value: Partial<Appointment>) {
    update((d) => ({
      ...d,
      appointments: d.appointments.map((x) =>
        x.id === a.id ? { ...x, ...value } : x,
      ),
    }))
  }
  function save(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setMessage("")
    if (!lot.trim() || !site || !time || !signature.trim()) return
    const dose = {
      id: `${a.id}-${vaccine}`,
      vaccine,
      lot: lot.trim(),
      site,
      time,
      date: a.date,
      signature: signature.trim(),
      reported: false,
    }
    try {
      saveDose(data, a.id, dose)
      update((d) => saveDose(d, a.id, dose))
      setMessage(
        "Signed dose saved locally. Proof now reflects this saved entry only.",
      )
      setLot("")
      setSubmitted(false)
      setVaccine(
        a.vaccines.find(
          (id) => id !== vaccine && !a.doses.some((d) => d.vaccine === id),
        ) || vaccine,
      )
    } catch (e) {
      setMessage((e as Error).message)
    }
  }
  async function report() {
    setBusy(true)
    setMessage("")
    const success = await simulatedRequest(
      data.scenario.reporting === "success",
    )
    update((d) => ({
      ...d,
      appointments: d.appointments.map((x) =>
        x.id === a.id
          ? {
              ...x,
              reportStatus: success ? "reported" : "failed",
              doses: x.doses.map((dose) => ({
                ...dose,
                reported: success || dose.reported,
              })),
            }
          : x,
      ),
    }))
    event(
      `${a.seeded ? "Seeded example: " : ""}${
        success
          ? "Registry simulation acknowledged saved doses"
          : "Registry simulation unavailable; manual export needed"
      }`,
      "report",
    )
    setMessage(
      success
        ? "Simulated registry acknowledgement saved. No real registry received anything."
        : "Simulated reporting failed. Download a manual export for the demo handoff; exporting does not mean the doses were reported.",
    )
    setBusy(false)
  }
  return (
    <div className="appointment-details">
      <Card>
        <div className="section-heading">
          <div>
            <div className="eyebrow">APPOINTMENT · {a.id}</div>
            <Heading level={2}>{a.child.name}</Heading>
          </div>
          <Badge>{a.seeded ? "Seeded example" : "Parent booking"}</Badge>
        </div>
        <p className="muted">
          Age {ageAt(a.child.birthDate, a.date)} · Born{" "}
          {dateLabel(a.child.birthDate)} · Grade {a.child.grade}
          <br />
          {a.child.school}
        </p>
        <div className="detail-grid">
          <div>
            <small>Visit</small>
            <strong>
              {dateLabel(a.date)} · {a.time} Pacific
            </strong>
          </div>
          <div>
            <small>Location & clinician</small>
            <strong>
              {location?.name}
              <br />
              {provider?.name}
            </strong>
          </div>
          <div>
            <small>Selected vaccines</small>
            <strong>
              {a.vaccines
                .map((id) => vaccines.find((v) => v.id === id)?.name)
                .join(" · ")}
            </strong>
          </div>
          <div>
            <small>Booked from</small>
            <strong>{entrySources.find((s) => s.id === a.source)?.label ?? "School notice"}</strong>
          </div>
          <div>
            <small>Intake form</small>
            <strong>{a.intake ? a.intake : "Not filled in"}</strong>
          </div>
          <div>
            <small>Guardian consent</small>
            <strong>On file · {a.consent}</strong>
          </div>
          <div>
            <small>Prescription / authorization</small>
            <strong>{a.prescription}</strong>
          </div>
          <div>
            <small>Cost status</small>
            <strong>
              {money(a.cost)} · {a.costLabel}
            </strong>
          </div>
          <div>
            <small>Record source</small>
            <strong>{a.recordSource}</strong>
          </div>
          <div>
            <small>Record review</small>
            <strong>
              {a.reviews.length === 4
                ? "Checklist confirmed"
                : "Awaiting clinician review"}
            </strong>
          </div>
        </div>
        <Alert>
          Clinical decisions remain with the clinician. Sample rules,
          eligibility and intervals are unverified and are not recommendations
          to vaccinate.
        </Alert>
        <div className="follow-up-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">AI FOLLOW-UP DRAFT</div>
              <Heading level={2}>Keep the parent in the loop</Heading>
            </div>
            <Badge kind={a.parentConfirmation === "confirmed" ? "success" : ""}>
              {a.parentConfirmation === "confirmed" ? "Confirmed" : a.parentConfirmation === "sent" ? "Sent" : "Pending"}
            </Badge>
          </div>
          <p className="muted">
            Suggested message: “{a.child.name.split(" ")[0]}’s visit has been reviewed. Please confirm you received this update.”
          </p>
          <div className="action-row">
            <Button
              variant="secondary"
              onClick={() => {
                patch({ parentConfirmation: "sent" })
                event(`Parent follow-up sent for ${a.child.name}`, "follow-up")
              }}
            >
              Send demo follow-up
            </Button>
            <Button
              variant="text"
              onClick={() => {
                patch({ parentConfirmation: "confirmed" })
                event(`Parent confirmed vaccine update for ${a.child.name}`, "follow-up")
              }}
            >
              Confirm received
            </Button>
          </div>
          <div className="form-grid follow-up-fields">
            <Field label="Schedule one follow-up" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            <Field label="Follow-up note" value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} placeholder="AI draft or reminder" />
          </div>
          <Button
            variant="secondary"
            disabled={!followUpDate}
            onClick={() => {
              patch({ followUpDate, followUpNote: followUpNote || "Review parent confirmation and remaining doses." })
              event(`Follow-up scheduled for ${a.child.name}`, "follow-up")
            }}
          >
            Schedule follow-up
          </Button>
          {a.followUpDate && <p className="inline-note">Follow-up scheduled for {dateLabel(a.followUpDate)} · {a.followUpNote}</p>}
        </div>
      </Card>
      <Card>
        <Heading level={2}>Review checklist</Heading>
        <OfficialSource topic="consent and who may vaccinate a child" />
        <p className="muted">
          Confirm each item before signing an entry. Review the actual
          documentation in a real clinical workflow.
        </p>
        <div className="checklist">
          {reviewItems.map((item) => (
            <Check
              key={item}
              disabled={inactive || completed}
              checked={a.reviews.includes(item)}
              onChange={(e) =>
                patch({
                  reviews: e.target.checked
                    ? [...a.reviews, item]
                    : a.reviews.filter((r) => r !== item),
                })
              }
            >
              {item}
            </Check>
          ))}
        </div>
      </Card>
      <Card>
        <div className="section-heading">
          <Heading level={2}>Record administered doses</Heading>
          <span className="muted">
            {a.doses.length} of {a.vaccines.length} recorded
          </span>
        </div>
        {a.doses.map((d) => (
          <div className="saved-dose" key={d.id}>
            <Icon name="check" />
            <div>
              <strong>
                {vaccines.find((v) => v.id === d.vaccine)?.name} · Signed and
                saved
              </strong>
              <p>
                {dateLabel(d.date)} · {d.time} · Lot {d.lot}
                <br />
                {d.site} · {d.signature}
              </p>
            </div>
          </div>
        ))}
        {inactive ? (
          <Alert>
            {a.cancelled
              ? "This appointment was cancelled. No new doses can be recorded."
              : `Declined / referred: ${a.referral}`}
          </Alert>
        ) : completed ? (
          <Alert kind="success">
            All selected dose entries are saved. This appointment is complete.
          </Alert>
        ) : (
          <form onSubmit={save} noValidate>
            <div className="form-grid">
              <Select
                label="Administered vaccine"
                value={vaccine}
                onChange={(e) => setVaccine(e.target.value)}
              >
                {a.vaccines.map((id) => (
                  <option
                    key={id}
                    value={id}
                    disabled={a.doses.some((d) => d.vaccine === id)}
                  >
                    {vaccines.find((v) => v.id === id)?.name}
                    {a.doses.some((d) => d.vaccine === id) ? " (saved)" : ""}
                  </option>
                ))}
              </Select>
              <Field
                label="Lot number"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                error={
                  submitted && !lot.trim() ? "Enter a lot number." : undefined
                }
              />
              <Select
                label="Administration site"
                value={site}
                onChange={(e) => setSite(e.target.value)}
              >
                <option value="">Select site</option>
                <option>Left deltoid</option>
                <option>Right deltoid</option>
                <option>Left thigh</option>
                <option>Right thigh</option>
              </Select>
              <Field
                label="Administration time (Pacific)"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                error={
                  submitted && !time ? "Enter administration time." : undefined
                }
              />
            </div>
            {submitted && !site && (
              <p className="error">Select an administration site.</p>
            )}
            <Field
              label="Signing clinician’s full name"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              error={
                submitted && !signature.trim()
                  ? "Enter the signing clinician’s name."
                  : undefined
              }
            />
            <p className="inline-note">
              Administration date: {dateLabel(a.date)} · Typed name is a demo
              signature, not a legally secure signature.
            </p>
            {a.reviews.length < 4 && (
              <Alert>Complete all four review checks to enable saving.</Alert>
            )}
            <Button
              type="submit"
              disabled={
                a.reviews.length < 4 ||
                a.doses.some((d) => d.vaccine === vaccine)
              }
            >
              Sign and save dose
              <Icon name="check" size={17} />
            </Button>
          </form>
        )}
      </Card>
      {a.doses.length > 0 && (
        <>
          <Proof appointment={a} />
          <Card>
            <div className="section-heading">
              <Heading level={2}>Registry reporting</Heading>
              <span className="action-row" style={{ margin: 0 }}>
                {a.doses.length > 0 && <Badge kind={a.parentReceived ? "success" : ""}>{a.parentReceived ? "Parent received" : "Parent not yet received"}</Badge>}
                <Badge kind={a.reportStatus === "reported" ? "success" : ""}>
                  {a.reportStatus}
                </Badge>
              </span>
            </div>
            <p className="muted">
              {a.doses.filter((d) => d.reported).length} of {a.doses.length}{" "}
              saved doses acknowledged in simulation.
            </p>
            <div className="action-row">
              <Button
                disabled={busy || a.doses.every((d) => d.reported)}
                onClick={report}
              >
                {busy ? "Sending simulation…" : "Simulate registry submission"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  exportDoses(a)
                  if (a.reportStatus !== "reported")
                    patch({ reportStatus: "exported" })
                  event(
                    "Manual demo dose export downloaded; not submitted",
                    "export",
                  )
                  setMessage(
                    "CSV export downloaded. This does not mark doses as registry-reported.",
                  )
                }}
              >
                Download manual export
              </Button>
            </div>
            <p className="inline-note">
              No registry connection. An export, a registry acknowledgement,
              proof and school acceptance are separate.
            </p>
          </Card>
        </>
      )}
      {message && <Alert>{message}</Alert>}
      {!completed && !inactive && (
        <Button
          variant="secondary"
          onClick={() => dialogRef.current?.showModal()}
        >
          Decline or refer
        </Button>
      )}
      <dialog ref={dialogRef} aria-labelledby="referral-heading">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!reason) return
            patch({ referral: reason })
            event(
              `${
                a.seeded ? "Seeded example: " : ""
              }Appointment declined / referred: ${reason}`,
              "referral",
            )
            dialogRef.current?.close()
          }}
        >
          <div id="referral-heading">
            <Heading level={2}>Decline or refer</Heading>
          </div>
          <p>
            Existing signed dose entries are retained. The clinician decides
            whether this appointment should proceed.
          </p>
          <Select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            <option value="">Choose a reason</option>
            <option>Record needs further review</option>
            <option>Consent not confirmed</option>
            <option>Clinical concern — refer to physician</option>
            <option>Prescription / authorization unavailable</option>
            <option>Guardian declined</option>
          </Select>
          <div className="dialog-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!reason}>
              Save decision
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  )
}

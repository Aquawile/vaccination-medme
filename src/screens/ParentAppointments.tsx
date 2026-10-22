import { useRef, useState } from "react"
import { Alert, Badge, Button, Card, Heading, Icon } from "../components/ui"
import {
  appointmentStatus,
  dateLabel,
  locations,
  money,
  type Appointment,
} from "../demo/journey"
import { vaccines } from "../demo/config"
import { useDemo } from "../state"
import Proof from "../components/Proof"
import { downloadBlob } from "../demo/documents"
export default function ParentAppointments({ onBook }: { onBook: () => void }) {
  const { data, update, event } = useDemo()
  const [cancelId, setCancelId] = useState("")
  const dialog = useRef<HTMLDialogElement>(null)
  const appointments = data.appointments
    .filter((a) => !a.seeded)
    .slice()
    .reverse()
  const [open, setOpen] = useState(appointments[0]?.id || "")
  function calendar(a: Appointment) {
    const location = locations.find((p) => p.id === a.locationId)
    downloadBlob(
      new Blob(
        [
          `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Local Demo//Appointment//EN\r\nBEGIN:VEVENT\r\nUID:${a.id}@example.test\r\nDTSTAMP:20260908T120000Z\r\nDTSTART;TZID=America/Los_Angeles:${a.date.replace(/-/g, "")}T${a.time.replace(":", "")}00\r\nDURATION:PT30M\r\nSUMMARY:DEMO vaccination appointment\r\nLOCATION:${location?.name}\r\nDESCRIPTION:Fictional appointment. Pacific local time. No live booking.\r\nEND:VEVENT\r\nEND:VCALENDAR`,
        ],
        { type: "text/calendar" },
      ),
      `${a.id}-demo.ics`,
    )
  }
  return (
    <main className="parent-main">
      <div className="page-heading">
        <div className="eyebrow">ALL IN ONE PLACE</div>
        <Heading>Your appointments</Heading>
        <p>Bookings, visit updates and saved dose summaries.</p>
      </div>
      {appointments.length === 0 ? (
        <Card>
          <div className="empty-state">
            <span className="surface-icon">
              <Icon name="calendar" />
            </span>
            <Heading level={2}>No appointments yet</Heading>
            <p>Review your child’s records, then choose a location and time.</p>
            <Button onClick={onBook}>
              Start with your child’s details
              <Icon name="arrow" size={17} />
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Alert kind="success">
            Your demo bookings are saved on this device. Sign in with the
            pharmacist account to review the appointment and record the visit.
          </Alert>
          <div className="parent-appointments">
            {appointments.map((a) => {
              const location = locations.find((p) => p.id === a.locationId)
              const clinician = location?.providers.find(
                (p) => p.id === a.providerId,
              )
              return (
                <div key={a.id}>
                  <Card>
                    <div className="section-heading">
                      <div>
                        <div className="eyebrow">{a.id}</div>
                        <Heading level={2}>{a.child.name}</Heading>
                      </div>
                      <Badge
                        kind={
                          appointmentStatus(a) === "Completed" ? "success" : ""
                        }
                      >
                        {appointmentStatus(a)}
                      </Badge>
                    </div>
                    <p className="appointment-date">
                      <Icon name="calendar" />
                      {dateLabel(a.date)} · {a.time} Pacific
                    </p>
                    <p className="muted">
                      {location?.name}
                      <br />
                      {location?.address}
                      <br />
                      {clinician?.name}
                    </p>
                    <div className="appointment-vaccines">
                      {a.vaccines.map((id) => (
                        <Badge key={id}>
                          {vaccines.find((v) => v.id === id)?.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="seed-summary">
                      <span>Confirmed demo cost</span>
                      <strong>{money(a.cost)}</strong>
                      <span>Administered doses recorded</span>
                      <strong>
                        {a.doses.length} of {a.vaccines.length}
                      </strong>
                      <span>Guardian consent</span>
                      <strong>{a.consent}</strong>
                    </div>
                    {a.referral && (
                      <Alert>
                        Clinician decision: {a.referral}. No further doses will
                        be recorded for this appointment. Review with another
                        clinician before making a new booking.
                      </Alert>
                    )}
                    <div className="action-row">
                      {!a.cancelled && !a.referral && a.doses.length === 0 && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => calendar(a)}
                          >
                            Add demo to calendar
                          </Button>
                          <Button
                            variant="text"
                            onClick={() => {
                              setCancelId(a.id)
                              dialog.current?.showModal()
                            }}
                          >
                            Cancel appointment
                          </Button>
                        </>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => setOpen(open === a.id ? "" : a.id)}
                      >
                        {open === a.id
                          ? "Hide visit summary"
                          : "View visit summary"}
                      </Button>
                    </div>
                  </Card>
                  {open === a.id && <Proof appointment={a} />}
                </div>
              )
            })}
          </div>
          <Button
            className="full next-step"
            variant="secondary"
            onClick={onBook}
          >
            Review requirements / book another visit
          </Button>
        </>
      )}
      <dialog ref={dialog} aria-labelledby="cancel-appointment-title">
        <div id="cancel-appointment-title">
          <Heading level={2}>Cancel this demo appointment?</Heading>
        </div>
        <p>
          The time becomes available again. The appointment remains in your
          history.
        </p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => dialog.current?.close()}>
            Keep appointment
          </Button>
          <Button
            onClick={() => {
              update((d) => ({
                ...d,
                appointments: d.appointments.map((a) =>
                  a.id === cancelId && !a.doses.length
                    ? { ...a, cancelled: true }
                    : a,
                ),
              }))
              event("Demo appointment cancelled", "cancellation")
              dialog.current?.close()
            }}
          >
            Confirm cancellation
          </Button>
        </div>
      </dialog>
    </main>
  )
}

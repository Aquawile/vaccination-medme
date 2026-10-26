import { useState, type FormEvent } from "react"
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
import { defaults, vaccines } from "../demo/config"
import { useDemo } from "../state"
import RecordPanel from "../components/RecordPanel"
import entrySources from "../data/entrySources.json"
import Records from "./parent/Records"
import Messages, { unreadCount } from "./parent/Messages"
import Booking from "./Booking"
import ParentAppointments from "./ParentAppointments"
import usePageTransition from "../usePageTransition"
import { dateLabel } from "../demo/journey"
export function RecordState({
  state,
}: {
  state: "unavailable" | "awaiting" | "complete"
}) {
  const content = {
    unavailable: [
      "Record unavailable",
      "We could not retrieve a record. This does not mean your child has received no vaccines.",
    ],
    awaiting: [
      "Record awaiting review",
      "A record is available, but its contents have not been verified.",
    ],
    complete: [
      "Requirements complete",
      "No outstanding sample requirements in this scenario.",
    ],
  }
  return (
    <Alert kind={state === "complete" ? "success" : "info"}>
      <strong>{content[state][0]}</strong>
      <p>{content[state][1]}</p>
    </Alert>
  )
}
export function ChildRequirements({ onBook }: { onBook: () => void }) {
  const { data, update, event } = useDemo()
  const [step, setStep] = useState(data.childSaved ? 2 : 1)
  usePageTransition(step)
  const [child, setChild] = useState(data.child)
  const [selection, setSelection] = useState(data.selection)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const errors = {
    name: !child.name.trim() ? "Enter your child’s name." : "",
    birthDate:
      !child.birthDate ||
      child.birthDate > defaults.referenceDate ||
      child.birthDate < defaults.minimumBirthDate
        ? `Enter a valid school-age birth date before ${dateLabel(defaults.referenceDate)}.`
        : "",
  }
  function submit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (errors.name || errors.birthDate) return
    update((d) => ({ ...d, child, childSaved: true }))
    if (!data.childSaved)
      event(`Child profile created for ${child.name}`, "profile")
    setStep(2)
  }
  const age =
    new Date(defaults.referenceDate).getFullYear() -
    new Date(child.birthDate).getFullYear() -
    (defaults.referenceDate.slice(5) < child.birthDate.slice(5) ? 1 : 0)
  return (
    <main className="parent-main">
      <div className="progress">
        <span className={step === 1 ? "current" : "done"}>
          <b>{step > 1 ? <Icon name="check" size={14} /> : "1"}</b>Child details
        </span>
        <i />
        <span className={step === 2 ? "current" : ""}>
          <b>2</b>School requirements
        </span>
      </div>
      {step === 1 ? (
        <>
          <div className="page-heading">
            <div className="eyebrow">LET’S START WITH THE BASICS</div>
            <Heading>Your child’s details</Heading>
            <p>A few details help us show the right school requirements.</p>
          </div>
          <Card>
            <div className="card-heading">
              <span className="surface-icon">
                <Icon name="user" />
              </span>
              <div>
                <Heading level={2}>A little about your child</Heading>
                <p>You can update these details at any time.</p>
              </div>
            </div>
            <form onSubmit={submit} noValidate>
              <Field
                label="Child’s full name"
                value={child.name}
                onChange={(e) => setChild({ ...child, name: e.target.value })}
                error={submitted ? errors.name : undefined}
              />
              <div className="form-grid">
                <Field
                  label="Date of birth"
                  type="date"
                  max={defaults.referenceDate}
                  value={child.birthDate}
                  onChange={(e) =>
                    setChild({ ...child, birthDate: e.target.value })
                  }
                  error={submitted ? errors.birthDate : undefined}
                />
                <Select
                  label="Grade"
                  value={child.grade}
                  onChange={(e) =>
                    setChild({ ...child, grade: e.target.value })
                  }
                >
                  {["K", "1", "2", "3", "4", "5"].map((g) => (
                    <option key={g} value={g}>
                      {g === "K" ? "Kindergarten" : `Grade ${g}`}
                    </option>
                  ))}
                </Select>
              </div>
              <Select
                label="School"
                value={child.school}
                onChange={(e) => setChild({ ...child, school: e.target.value })}
              >
                {defaults.schools.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
              <div className="inline-note">
                <Icon name="info" size={17} /> Fictional Oregon schools ·
                Reference date: {dateLabel(defaults.referenceDate)}
              </div>
              <div className="form-actions">
                <span>
                  <Icon name="lock" size={15} /> Saved on this device only
                </span>
                <Button type="submit">
                  Save and continue
                  <Icon name="arrow" size={17} />
                </Button>
              </div>
            </form>
          </Card>
          <p className="under-note">
            One step at a time. You’ll review the sample requirements next.
          </p>
        </>
      ) : (
        <>
          <Button variant="text" onClick={() => setStep(1)}>
            <Icon name="back" size={17} />
            Back to child details
          </Button>
          <div className="page-heading">
            <div className="eyebrow">A CLEARER PICTURE</div>
            <Heading>School requirements</Heading>
            <p>
              Review what’s not documented as complete, then choose what to
              save.
            </p>
          </div>
          <Card className="child-summary">
            <span className="avatar">{child.name[0]}</span>
            <div>
              <Heading level={2}>{child.name}</Heading>
              <p>
                Age {age} · Grade {child.grade} · {child.school}
              </p>
            </div>
            <Badge>Oregon</Badge>
          </Card>
          <div className="record-source">
            <Icon name="document" />
            <div>
              <strong>Sample record</strong>
              <p>
                {data.record.source} · Retrieved {data.record.retrieved}
              </p>
            </div>
            <Badge>
              {data.record.state === "complete"
                ? "Sample complete"
                : "Awaiting clinical review"}
            </Badge>
          </div>
          <RecordPanel />
          {data.record.state !== "sample" && (
            <RecordState state={data.record.state} />
          )}
          <Alert>
            <strong>Sample requirements, not clinical guidance</strong>
            <p>
              {data.record.state === "sample"
                ? "These two doses are not documented as complete in the sample record."
                : data.record.state === "complete"
                  ? "This sample scenario has no outstanding requirements."
                  : "Record contents are unverified or unavailable; the sample options below do not establish missing vaccinations."}{" "}
              A pharmacist must review records and determine whether vaccination
              is appropriate. Earliest dates below are illustrative only.
            </p>
          </Alert>
          <div className="section-heading">
            <div>
              <div className="eyebrow">NEXT STEP</div>
              <Heading level={2}>Doses to review</Heading>
            </div>
            <span className="muted">Select any to save</span>
          </div>
          {data.record.state !== "complete" && (
            <div className="vaccine-list">
              {vaccines.map((v) => (
                <Card
                  key={v.id}
                  className={`vaccine-card ${
                    selection.includes(v.id) ? "selected" : ""
                  }`}
                >
                  <Check
                    checked={selection.includes(v.id)}
                    onChange={(e) => {
                      setSaved(false)
                      setSelection(
                        e.target.checked
                          ? [...selection, v.id]
                          : selection.filter((id) => id !== v.id),
                      )
                    }}
                  >
                    <div className="vaccine-title">
                      <Heading level={3}>{v.name}</Heading>
                      <Badge>{v.dose} · Sample</Badge>
                    </div>
                    <p>{v.detail}</p>
                    <p>
                      {data.rules.find((r) => r.id === v.id)?.requirement} ·{" "}
                      {data.rules.find((r) => r.id === v.id)?.status}
                    </p>
                    <div className="earliest">
                      <Icon name="calendar" size={16} /> Sample earliest date:{" "}
                      {v.earliest}
                    </div>
                  </Check>
                </Card>
              ))}
            </div>
          )}
          {saved && (
            <Alert kind="success">
              <strong>Selection saved</strong>
              <p>
                {selection.length
                  ? `${selection.length} sample dose${
                      selection.length > 1 ? "s" : ""
                    } saved for review.`
                  : "No doses selected. Your empty selection was saved."}{" "}
                You can now choose a location, clinician, date and time.
              </p>
            </Alert>
          )}
          {data.record.state !== "complete" && (
            <div className="selection-footer">
              <span>{selection.length} of 2 selected</span>
              <Button
                onClick={() => {
                  update((d) => ({ ...d, selection }))
                  event(
                    `Saved vaccine selection (${selection.length} doses)`,
                    "selection",
                  )
                  setSaved(true)
                }}
              >
                Save selection
                <Icon name="check" size={17} />
              </Button>
            </div>
          )}
          {saved &&
            selection.length > 0 &&
            data.record.state !== "complete" && (
              <Button className="full next-step" onClick={onBook}>
                Find a location and time
                <Icon name="arrow" size={17} />
              </Button>
            )}
          <p className="under-note">
            Saving a selection does not book an appointment.
          </p>
        </>
      )}
    </main>
  )
}
export default function Parent() {
  const { data, update, event } = useDemo()
  const [view, setView] = useState("home")
  usePageTransition(view)
  return (
    <>
      <nav className="parent-nav" aria-label="Parent workspace">
        <Button
          variant={view === "home" ? "nav-active" : "text"}
          onClick={() => setView("home")}
        >
          School notice
        </Button>
        <Button
          variant={
            view === "details" || view === "booking" ? "nav-active" : "text"
          }
          onClick={() => setView("details")}
        >
          Child & requirements
        </Button>
        <Button
          variant={view === "appointments" ? "nav-active" : "text"}
          onClick={() => setView("appointments")}
        >
          Your appointments
          <Badge>
            {data.appointments.filter((a) => !a.seeded && !a.cancelled).length}
          </Badge>
        </Button>
        <Button variant={view === "records" ? "nav-active" : "text"} onClick={() => setView("records")}>
          Records
        </Button>
        <Button variant={view === "messages" ? "nav-active" : "text"} onClick={() => setView("messages")}>
          Messages
          {unreadCount(data.appointments) > 0 && <Badge kind="warning">{unreadCount(data.appointments)}</Badge>}
        </Button>
      </nav>
      {view === "home" ? (
        <main className="parent-main">
          <div className="page-heading">
            <div className="eyebrow">{defaults.campaign.toUpperCase()}</div>
            <Heading>Your school notice</Heading>
            <p>A few clear steps to review records and arrange a visit.</p>
          </div>
          <Card className="school-notice">
            <span className="surface-icon">
              <Icon name="document" />
            </span>
            <Badge>Fictional school campaign</Badge>
            <Heading level={2}>School vaccination record review</Heading>
            <p>Dear parent or guardian,</p>
            <p>
              Please review {data.child.name.split(" ")[0]}’s vaccination
              documents for the new school year. If anything needs review, you
              can find a participating location and book a sample appointment
              here.
            </p>
            <div className="notice-steps">
              <span>
                <b>1</b>Review your child’s records
              </span>
              <span>
                <b>2</b>Choose a location, clinician and time
              </span>
              <span>
                <b>3</b>Receive a summary after the visit
              </span>
            </div>
            {data.entrySource !== "school" && (
              <Alert>{entrySources.find((s) => s.id === data.entrySource)?.line} The steps are the same: check what is missing, book at a pharmacy, get your record.</Alert>
            )}
            <Alert>
              This is a fictional Oregon campaign, dated{" "}
              {dateLabel(defaults.referenceDate)}. Sample requirements are not
              verified clinical guidance. No real notice, message or appointment
              is sent.
            </Alert>
            <Button
              className="full"
              onClick={() => {
                if (!data.noticeOpened) {
                  update((d) => ({ ...d, noticeOpened: true }))
                  event("Sample school notice opened (simulated scan)", "scan")
                }
                setView("details")
              }}
            >
              Review child details
              <Icon name="arrow" size={17} />
            </Button>
          </Card>
          {data.appointments.some((a) => !a.seeded) && (
            <Button
              className="full next-step"
              variant="secondary"
              onClick={() => setView("appointments")}
            >
              View your appointments
            </Button>
          )}
        </main>
      ) : view === "records" ? (
        <Records />
      ) : view === "messages" ? (
        <Messages />
      ) : view === "details" ? (
        <ChildRequirements onBook={() => setView("booking")} />
      ) : view === "booking" ? (
        <Booking
          onBack={() => setView("details")}
          onBooked={() => setView("appointments")}
        />
      ) : (
        <ParentAppointments onBook={() => setView("details")} />
      )}
    </>
  )
}

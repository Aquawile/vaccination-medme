import { useState } from "react"
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
import {
  bookingDates,
  bookingTimes,
  dateLabel,
  eligibility,
  insuranceScenarios,
  locations,
  money,
} from "../demo/journey"
import { createBooking, quoteCost, simulatedRequest } from "../demo/services"
import { useDemo } from "../state"
import { vaccines } from "../demo/config"
import usePageTransition from "../usePageTransition"
export default function Booking({
  onBack,
  onBooked,
}: {
  onBack: () => void
  onBooked: () => void
}) {
  const { data, update } = useDemo()
  const [step, setStep] = useState(1)
  usePageTransition(step)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [checkedQuote, setCheckedQuote] = useState("")
  const draft = data.draft
  const patch = (value: Partial<typeof draft>) => {
    update((d) => ({ ...d, draft: { ...d.draft, ...value } }))
    setError("")
    setCheckedQuote("")
  }
  const location = locations.find((p) => p.id === draft.locationId)
  const provider = location?.providers.find((p) => p.id === draft.providerId)
  const cost = quoteCost(draft, data.selection, data.scenario.insurance)
  const quoteKey = JSON.stringify([
    draft.locationId,
    draft.payment,
    draft.plan,
    data.selection,
    data.scenario.insurance,
  ])
  const busySlot = (time: string) =>
    data.appointments.some(
      (a) =>
        !a.cancelled &&
        !a.referral &&
        a.providerId === draft.providerId &&
        a.date === draft.date &&
        a.time === time,
    )
  const eligible =
    !!location &&
    !eligibility(
      location,
      data.child,
      data.selection,
      data.scenario.prescription,
    ).length
  async function confirm() {
    setBusy(true)
    setError("")
    await simulatedRequest(true)
    try {
      // Validate again in the functional update against the latest shared state.
      createBooking(data, draft)
      update((d) => createBooking(d, d.draft))
      onBooked()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  if (!data.selection.length)
    return (
      <main className="parent-main">
        <Alert>
          Choose and save at least one vaccine for review before searching.
        </Alert>
        <Button onClick={onBack}>Back to requirements</Button>
      </main>
    )
  return (
    <main className="parent-main booking-main">
      <Button
        variant="text"
        onClick={() => (step === 1 ? onBack() : setStep(step - 1))}
      >
        <Icon name="back" size={17} />
        Back
      </Button>
      <div className="booking-progress">
        {["Location", "Date & time", "Cost", "Review"].map((label, i) => (
          <span
            key={label}
            className={step === i + 1 ? "current" : step > i + 1 ? "done" : ""}
          >
            <b>{step > i + 1 ? <Icon name="check" size={13} /> : i + 1}</b>
            {label}
          </span>
        ))}
      </div>
      <div className="page-heading">
        <div className="eyebrow">
          APPOINTMENT FOR {data.child.name.toUpperCase()}
        </div>
        <Heading>
          {
            [
              "Choose a location",
              "Choose a date and time",
              "Review your cost",
              "Review and book",
            ][step - 1]
          }
        </Heading>
        <p>
          {
            [
              "Find a sample location that can review your selected vaccines.",
              "Choose a clinician, then an available 30-minute visit.",
              "No surprises: a confirmed price is required before booking.",
              "Check the details and confirm guardian consent.",
            ][step - 1]
          }
        </p>
      </div>
      <div className="booking-context">
        <Icon name="document" size={17} />
        {data.selection
          .map((id) => vaccines.find((v) => v.id === id)?.name)
          .join(" + ")}
        <span>Sample eligibility only</span>
      </div>
      {step === 1 && (
        <>
          <Field
            label="Search fictional locations"
            placeholder="Search pharmacy, clinic or street"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="location-list">
            {locations
              .filter((p) =>
                `${p.name} ${p.address}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((p) => {
                const reasons = eligibility(
                  p,
                  data.child,
                  data.selection,
                  data.scenario.prescription,
                )
                return (
                  <Card
                    key={p.id}
                    className={
                      p.id === draft.locationId
                        ? "location-card selected"
                        : "location-card"
                    }
                  >
                    <div className="section-heading">
                      <span className="surface-icon">
                        <Icon name={p.id === "fern" ? "user" : "shield"} />
                      </span>
                      <Badge kind={reasons.length ? "warning" : "success"}>
                        {reasons.length
                          ? "Not eligible in sample"
                          : "Eligible in sample"}
                      </Badge>
                    </div>
                    <Heading level={2}>{p.name}</Heading>
                    <p>{p.address}</p>
                    <div className="location-meta">
                      <span>{p.distance} · Fictional distance</span>
                      <span>
                        {p.id === "fern"
                          ? "Pediatric physician"
                          : "Immunizing pharmacists"}
                      </span>
                    </div>
                    {reasons.length ? (
                      <Alert>
                        {reasons.join(" ")}
                        <p>
                          Try Fern Valley Family Clinic for a broader sample age
                          range and clinician review.
                        </p>
                      </Alert>
                    ) : (
                      <p className="inline-note">
                        Offers selected vaccines · Sample age range {p.minAge}–
                        {p.maxAge} · Clinician verification required
                      </p>
                    )}
                    <Button
                      variant={
                        p.id === draft.locationId ? "primary" : "secondary"
                      }
                      className="full"
                      disabled={!!reasons.length}
                      onClick={() => {
                        patch({
                          locationId: p.id,
                          providerId: "",
                          date: "",
                          time: "",
                        })
                        setStep(2)
                      }}
                    >
                      {p.id === draft.locationId
                        ? "Selected location"
                        : "Choose this location"}
                      <Icon name="arrow" size={16} />
                    </Button>
                  </Card>
                )
              })}
          </div>
          {!locations.some((p) =>
            `${p.name} ${p.address}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          ) && (
            <Card>
              <Heading level={2}>No matching locations</Heading>
              <p className="muted">
                Try another name, or clear your search to view all fictional
                locations.
              </p>
              <Button variant="secondary" onClick={() => setSearch("")}>
                Clear search
              </Button>
            </Card>
          )}
          <p className="under-note">
            No maps, live distance calculations or real provider eligibility
            checks.
          </p>
        </>
      )}
      {step === 2 && location && (
        <Card>
          <div className="section-heading">
            <Heading level={2}>{location.name}</Heading>
            <Badge>30-minute visit</Badge>
          </div>
          <p className="muted">{location.address}</p>
          <div className="slot-section">
            <Heading level={3}>Who you’ll see</Heading>
            <div className="provider-options">
              {location.providers.map((p) => (
                <Button
                  key={p.id}
                  variant={
                    draft.providerId === p.id
                      ? "provider-option selected"
                      : "provider-option"
                  }
                  aria-pressed={draft.providerId === p.id}
                  onClick={() => patch({ providerId: p.id, time: "" })}
                >
                  <span className="avatar">{p.name[0]}</span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.title}</small>
                  </span>
                  {draft.providerId === p.id && <Icon name="check" size={16} />}
                </Button>
              ))}
            </div>
          </div>
          <div className="slot-section">
            <Heading level={3}>Available dates</Heading>
            <p className="inline-note">
              September 2026 · America/Los_Angeles (Pacific time)
            </p>
            <div className="date-options">
              {bookingDates.map((date) => (
                <Button
                  key={date}
                  variant={
                    draft.date === date ? "date-option selected" : "date-option"
                  }
                  aria-pressed={draft.date === date}
                  onClick={() => patch({ date, time: "" })}
                >
                  <small>
                    {new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </small>
                  <strong>{date.slice(-2)}</strong>
                  <span>Sep</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="slot-section">
            <Heading level={3}>Available times</Heading>
            {data.scenario.slots === "unavailable" ? (
              <Alert>
                No sample slots available at this time. Try another location or
                ask the demo administrator to restore availability. No
                appointment has been booked.
              </Alert>
            ) : !draft.providerId || !draft.date ? (
              <p className="muted">Choose a clinician and date to see times.</p>
            ) : (
              <div className="time-options">
                {bookingTimes.map((time) => (
                  <Button
                    key={time}
                    variant={
                      draft.time === time
                        ? "time-option selected"
                        : "time-option"
                    }
                    disabled={busySlot(time)}
                    aria-pressed={draft.time === time}
                    onClick={() => patch({ time })}
                  >
                    {time}
                    {busySlot(time) ? " · Booked" : ""}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <Button
            className="full"
            disabled={
              !eligible ||
              !draft.providerId ||
              !draft.date ||
              !draft.time ||
              data.scenario.slots === "unavailable"
            }
            onClick={() => setStep(3)}
          >
            Continue to cost
            <Icon name="arrow" size={17} />
          </Button>
        </Card>
      )}
      {step === 3 && (
        <Card>
          <Heading level={2}>How would you like to pay?</Heading>
          <p className="muted">
            All responses and prices are simulated. Nothing is charged.
          </p>
          <div className="payment-options">
            <Button
              variant={draft.payment === "self" ? "choice selected" : "choice"}
              aria-pressed={draft.payment === "self"}
              onClick={() => patch({ payment: "self" })}
            >
              <strong>Self-pay</strong>
              <span>
                {location ? money(location.price) : "—"} per selected dose
              </span>
            </Button>
            <Button
              variant={
                draft.payment === "insurance" ? "choice selected" : "choice"
              }
              aria-pressed={draft.payment === "insurance"}
              onClick={() => patch({ payment: "insurance" })}
            >
              <strong>Sample insurance</strong>
              <span>Check a fictional coverage response</span>
            </Button>
          </div>
          {draft.payment === "insurance" && (
            <Select
              label="Fictional insurance response"
              value={draft.plan}
              onChange={(e) => patch({ plan: e.target.value })}
            >
              {insuranceScenarios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          )}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              await simulatedRequest(true)
              setCheckedQuote(quoteKey)
              setBusy(false)
            }}
          >
            {busy ? "Checking sample cost…" : "Confirm sample cost"}
          </Button>
          {checkedQuote === quoteKey && (
            <Alert kind={cost === null ? "info" : "success"}>
              <strong>
                {cost === null
                  ? "Cost unknown"
                  : `Confirmed total: ${money(cost)}`}
              </strong>
              <p>
                {cost === null
                  ? "Booking is blocked. Choose confirmed self-pay or a different sample plan."
                  : `${data.selection.length} selected dose${
                      data.selection.length > 1 ? "s" : ""
                    } · ${
                      draft.payment === "self"
                        ? "Self-pay quote"
                        : "Simulated insurance response"
                    }. No real payment or insurance request.`}
              </p>
            </Alert>
          )}
          <Button
            className="full next-step"
            disabled={checkedQuote !== quoteKey || cost === null}
            onClick={() => setStep(4)}
          >
            Review appointment
            <Icon name="arrow" size={17} />
          </Button>
        </Card>
      )}
      {step === 4 && (
        <>
          <Card>
            <Heading level={2}>Your appointment details</Heading>
            <div className="review-summary">
              <div>
                <small>Child</small>
                <strong>
                  {data.child.name} · Grade {data.child.grade}
                </strong>
              </div>
              <div>
                <small>Where</small>
                <strong>{location?.name}</strong>
                <p>{location?.address}</p>
              </div>
              <div>
                <small>Clinician</small>
                <strong>{provider?.name}</strong>
              </div>
              <div>
                <small>When</small>
                <strong>
                  {dateLabel(draft.date)} at {draft.time} Pacific
                </strong>
                <p>30 minutes · Arrive 10 minutes early</p>
              </div>
              <div>
                <small>Selected for clinician review</small>
                <strong>
                  {data.selection
                    .map((id) => vaccines.find((v) => v.id === id)?.name)
                    .join(" + ")}
                </strong>
              </div>
              <div>
                <small>Confirmed sample total</small>
                <strong>
                  {cost === null ? "Unknown — booking blocked" : money(cost)}
                </strong>
              </div>
            </div>
            <Alert>
              Bring your child’s records and guardian identification. The
              clinician decides whether to administer each vaccine. Booking does
              not confirm clinical eligibility.
            </Alert>
            <Field
              label="Guardian’s full name"
              autoComplete="name"
              value={draft.guardian}
              onChange={(e) =>
                update((d) => ({
                  ...d,
                  draft: { ...d.draft, guardian: e.target.value },
                }))
              }
            />
            <Check
              checked={draft.consent}
              onChange={(e) =>
                update((d) => ({
                  ...d,
                  draft: { ...d.draft, consent: e.target.checked },
                }))
              }
            >
              I am the child’s guardian and consent to this demo appointment and
              clinician review. I understand all data, costs and authorizations
              are simulated.
            </Check>
          </Card>
          <div className="selection-footer">
            <span>
              {cost === null
                ? "Cost must be confirmed"
                : `${money(cost)} · No payment collected`}
            </span>
            <Button
              disabled={
                busy ||
                !draft.consent ||
                !draft.guardian.trim() ||
                cost === null ||
                !eligible
              }
              onClick={confirm}
            >
              {busy ? "Booking appointment…" : "Confirm demo booking"}
              <Icon name="check" size={17} />
            </Button>
          </div>
        </>
      )}
      {error && <Alert kind="error">{error}</Alert>}
    </main>
  )
}

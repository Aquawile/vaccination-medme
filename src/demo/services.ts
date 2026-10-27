import {
  accountRoles,
  defaults,
  initialData,
  vaccines,
  type DemoData,
} from "./config"
import {
  journeyDefaults,
  eligibility,
  locations,
  effectiveLocation,
  insuranceScenarios,
  bookingDates,
  bookingTimes,
  type Appointment,
  type Draft,
} from "./journey"
const DATA_KEY = "school-demo-data-v1"
const ACCOUNT_KEY = "school-demo-accounts-v1"
// DEMO-FAKE: browser storage is not a database or secure authentication.
export function loadData(): DemoData {
  try {
    const stored = JSON.parse(localStorage.getItem(DATA_KEY) || "null")
    const fresh = structuredClone({ ...initialData, ...journeyDefaults })
    if (!stored) return fresh
    const result = {
      ...fresh,
      ...stored,
      scenario: { ...fresh.scenario, ...stored.scenario },
      draft: { ...fresh.draft, ...stored.draft },
    }
    // DEMO-FAKE: migrate the milestone-one seed without discarding existing work.
    if (!stored.appointments)
      result.appointments = [
        {
          ...fresh.appointments[0],
          reviews: stored.reviews || [],
          referral: stored.referral || "",
          doses: (stored.doses || []).map((dose: object) => ({
            ...dose,
            date: defaults.referenceDate,
            reported: false,
          })),
        },
      ]
    return result
  } catch {
    return structuredClone({ ...initialData, ...journeyDefaults })
  }
}
// DEMO-FAKE: deterministic insurance, availability, registry and reporting responses.
export async function simulatedRequest<T>(result: T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 450))
  return result
}
export function quoteCost(
  draft: Draft,
  selected: string[],
  insuranceScenario = "normal",
): number | null {
  const location = locations.find((p) => p.id === draft.locationId)
  if (!location) return null
  if (draft.payment === "self") return location.price * selected.length
  if (insuranceScenario === "unavailable") return null
  const plan = insuranceScenarios.find((p) => p.id === draft.plan)
  return plan && plan.price !== null ? plan.price * selected.length : null
}
export function createBooking(data: DemoData, draft: Draft): DemoData {
  const location = locations.map((l) => effectiveLocation(l, data.published)).find((p) => p.id === draft.locationId)
  const cost = quoteCost(draft, data.selection, data.scenario.insurance)
  if (
    !data.childSaved ||
    !data.selection.length ||
    data.selection.some((id) => !vaccines.some((v) => v.id === id))
  )
    throw new Error(
      "Save a child profile and select at least one vaccine first.",
    )
  if (
    !location ||
    eligibility(
      location,
      data.child,
      data.selection,
      data.scenario.prescription,
    ).length
  )
    throw new Error("Choose an eligible location.")
  if (!location.providers.some((p) => p.id === draft.providerId))
    throw new Error("Choose a clinician at this location.")
  if (
    !bookingDates.includes(draft.date) ||
    !bookingTimes.includes(draft.time) ||
    data.scenario.slots === "unavailable"
  )
    throw new Error("Choose an available date and time.")
  if (
    vaccines.some(
      (v) => data.selection.includes(v.id) && draft.date < v.earliestDate,
    )
  )
    throw new Error(
      "The selected date is before the sample earliest date. This check is illustrative, not clinical guidance.",
    )
  if (
    data.appointments.some(
      (a) =>
        !a.cancelled &&
        !a.referral &&
        a.providerId === draft.providerId &&
        a.date === draft.date &&
        a.time === draft.time,
    )
  )
    throw new Error("This time was just booked. Please choose another time.")
  if (cost === null || !Number.isFinite(cost) || cost < 0)
    throw new Error(
      "A confirmed price or confirmed $0 is required before booking.",
    )
  if (!draft.consent || !draft.guardian.trim())
    throw new Error("Guardian name and consent are required.")
  if (
    data.appointments.some(
      (a) =>
        !a.seeded &&
        !a.cancelled &&
        !a.referral &&
        a.child.name === data.child.name &&
        a.child.birthDate === data.child.birthDate &&
        a.vaccines.some((v) => data.selection.includes(v)),
    )
  )
    throw new Error(
      "An appointment for these vaccines already exists. View or cancel it before booking again.",
    )
  const id = `APT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const appointment: Appointment = {
    ...structuredClone(journeyDefaults.appointments[0]),
    id,
    seeded: false,
    child: { ...data.child },
    vaccines: [...data.selection],
    locationId: location.id,
    providerId: draft.providerId,
    date: draft.date,
    time: draft.time,
    cost,
    costLabel:
      draft.payment === "self"
        ? "Confirmed sample self-pay"
        : "Confirmed sample insurance response",
    consent: `${draft.guardian.trim()} · ${draft.relationship} · consented ${defaults.referenceDate}`,
    source: data.entrySource,
    recordPhoto: data.record.photo,
    photoReview: data.record.photo ? ("pending" as const) : undefined,
    intake: draft.intake.trim(),
    recordSource: [
      data.record.source,
      data.record.retrieved,
      data.record.state,
      data.record.manual,
      data.record.attachment
        ? `Photo filename: ${data.record.attachment} (image not retained)`
        : "",
      "Not clinically verified",
    ]
      .filter(Boolean)
      .join(" · "),
    prescription: location.prescription
      ? "Sample authorization on file — clinician to verify"
      : "Clinician assessment / authorization at visit; not yet verified",
  }
  return {
    ...data,
    appointments: [...data.appointments, appointment],
    draft: structuredClone(journeyDefaults.draft),
    events: [
      {
        id: crypto.randomUUID(),
        text: `Appointment booked for ${appointment.child.name}`,
        type: "booking",
        time: new Date().toISOString(),
      },
      ...data.events,
    ],
  }
}
export function saveDose(
  data: DemoData,
  appointmentId: string,
  dose: Appointment["doses"][number],
): DemoData {
  const a = data.appointments.find((x) => x.id === appointmentId)
  if (
    !a ||
    a.cancelled ||
    a.referral ||
    a.reviews.length !== 4 ||
    !a.vaccines.includes(dose.vaccine) ||
    !dose.lot.trim() ||
    !dose.signature.trim() ||
    !dose.site ||
    !dose.time ||
    dose.date !== a.date
  )
    throw new Error(
      "Complete the review and all dose details for an active appointment.",
    )
  if (a.doses.some((d) => d.vaccine === dose.vaccine)) return data
  return {
    ...data,
    appointments: data.appointments.map((x) =>
      x.id === a.id ? { ...x, doses: [...x.doses, dose] } : x,
    ),
    events: [
      {
        id: crypto.randomUUID(),
        text: `${
          a.seeded ? "Seeded example: " : ""
        }Dose recorded for ${a.child.name}`,
        type: "dose",
        time: new Date().toISOString(),
      },
      ...data.events,
    ],
  }
}
/** Move a booked visit to another open time. The old time is freed because it is no longer held by this visit. */
export function rescheduleBooking(data: DemoData, id: string, date: string, time: string): DemoData {
  const a = data.appointments.find((x) => x.id === id)
  if (!a || a.cancelled || a.referral || a.doses.length) throw new Error("This visit can no longer be changed.")
  if (!bookingDates.includes(date) || !bookingTimes.includes(time)) throw new Error("Choose an available date and time.")
  if (vaccines.some((v) => a.vaccines.includes(v.id) && date < v.earliestDate))
    throw new Error("That date is before the sample earliest date. This check is illustrative, not clinical guidance.")
  if (data.appointments.some((x) => x.id !== id && !x.cancelled && !x.referral && x.providerId === a.providerId && x.date === date && x.time === time))
    throw new Error("That time was just taken. Choose another.")
  return { ...data, appointments: data.appointments.map((x) => (x.id === id ? { ...x, date, time } : x)) }
}
export function persistData(data: DemoData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}
// DEMO-FAKE: a real build emails a one-time code that expires. Here it is fixed and shown on screen.
export const DEMO_CODE = "482913"
export async function signInWithCode(email: string, code: string) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (!accountRoles[email]) throw new Error("This email has not been assigned access. Contact your demo administrator.")
  if (code.trim() !== DEMO_CODE) throw new Error("That code is not right. Check it and try again.")
  localStorage.setItem("school-demo-session", email)
  return email
}
// DEMO-FAKE: passwords are intentionally stored locally for this prototype only.
export async function authenticate(
  email: string,
  password: string,
  register: boolean,
) {
  await new Promise((resolve) => setTimeout(resolve, 550))
  const role = accountRoles[email]
  if (!role)
    throw new Error(
      "This email has not been assigned access. Contact your demo administrator.",
    )
  const accounts = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "{}")
  if (register && accounts[email])
    throw new Error("An account already exists. Please sign in.")
  if (!register && password !== (accounts[email] || defaults.password))
    throw new Error("The email or password is incorrect.")
  if (register)
    localStorage.setItem(
      ACCOUNT_KEY,
      JSON.stringify({ ...accounts, [email]: password }),
    )
  localStorage.setItem("school-demo-session", email)
  return email
}

import { defaults, initialData } from "./config"

export type Child = typeof initialData.child
export type Dose = {
  id: string
  vaccine: string
  lot: string
  site: string
  time: string
  date: string
  signature: string
  reported: boolean
}
export type Appointment = {
  id: string
  seeded: boolean
  campaign: string
  child: Child
  vaccines: string[]
  locationId: string
  providerId: string
  date: string
  time: string
  cost: number
  costLabel: string
  consent: string
  recordSource: string
  prescription: string
  reviews: string[]
  doses: Dose[]
  referral: string
  cancelled: boolean
  proofCreated: boolean
  proofShared: boolean
  schoolAccepted: boolean
  reportStatus: "not sent" | "reported" | "failed" | "exported"
  parentConfirmation?: "pending" | "sent" | "confirmed"
  followUpDate?: string
  followUpNote?: string
}
export const locations = [
  {
    id: "willow",
    name: "Willow & Pine Pharmacy",
    address: "124 Willow Lane, Cedar Glen, OR",
    distance: "1.2 miles",
    minAge: 5,
    maxAge: 17,
    vaccines: ["dtap", "polio"],
    prescription: false,
    price: 24,
    providers: [
      {
        id: "avery",
        name: "Avery Morgan, PharmD",
        title: "Immunizing pharmacist",
      },
      {
        id: "jordan",
        name: "Jordan Ellis, PharmD",
        title: "Immunizing pharmacist",
      },
    ],
  },
  {
    id: "fern",
    name: "Fern Valley Family Clinic",
    address: "38 Fern Avenue, Cedar Glen, OR",
    distance: "3.4 miles",
    minAge: 0,
    maxAge: 18,
    vaccines: ["dtap", "polio"],
    prescription: false,
    price: 32,
    providers: [
      { id: "riley", name: "Dr. Riley Chen, MD", title: "Pediatric physician" },
    ],
  },
  {
    id: "oak",
    name: "Oak Street Pharmacy",
    address: "210 Oak Street, Cedar Glen, OR",
    distance: "2.1 miles",
    minAge: 12,
    maxAge: 100,
    vaccines: ["polio"],
    prescription: true,
    price: 22,
    providers: [
      {
        id: "casey",
        name: "Casey Brooks, PharmD",
        title: "Immunizing pharmacist",
      },
    ],
  },
]
export const bookingDates = [
  "2026-09-09",
  "2026-09-10",
  "2026-09-11",
  "2026-09-14",
  "2026-09-15",
]
export const bookingTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "13:00",
  "13:30",
  "14:00",
  "15:30",
]
export const reviewItems = [
  "Identity and record reviewed",
  "Consent verified with guardian",
  "Clinical suitability and prescription reviewed",
  "Cost reviewed with guardian",
]
export const insuranceScenarios = [
  {
    id: "covered",
    label: "Sample covered plan",
    result: "Confirmed $0 in this simulation",
    price: 0,
  },
  {
    id: "copay",
    label: "Sample copay plan",
    result: "Confirmed $15 per dose in this simulation",
    price: 15,
  },
  {
    id: "unknown",
    label: "Sample plan — response unavailable",
    result: "Cost unknown. Choose self-pay or another sample plan to continue.",
    price: null,
  },
]
export type RecordInfo = {
  state: "sample" | "unavailable" | "awaiting" | "complete"
  source: string
  retrieved: string
  attachment: string
  manual: string
}
export type Draft = {
  locationId: string
  providerId: string
  date: string
  time: string
  payment: string
  plan: string
  guardian: string
  consent: boolean
}
export const emptyDraft: Draft = {
  locationId: "",
  providerId: "",
  date: "",
  time: "",
  payment: "self",
  plan: "covered",
  guardian: "",
  consent: false,
}
export const seedAppointment: Appointment = {
  id: "DEMO-001",
  seeded: true,
  campaign: "fall",
  child: initialData.child,
  vaccines: ["dtap", "polio"],
  locationId: "willow",
  providerId: "avery",
  date: defaults.referenceDate,
  time: "10:00",
  cost: 48,
  costLabel: "Confirmed sample self-pay",
  consent: "Taylor Parker · Seeded sample consent",
  recordSource: defaults.recordSource,
  prescription: "Sample authorization on file — clinician must verify",
  reviews: [],
  doses: [],
  referral: "",
  cancelled: false,
  proofCreated: false,
  proofShared: false,
  schoolAccepted: false,
  reportStatus: "not sent",
}
export const journeyDefaults = {
  appointments: [seedAppointment] as Appointment[],
  record: {
    state: "sample",
    source: defaults.recordSource,
    retrieved: defaults.retrievalDate,
    attachment: "",
    manual: "",
  } as RecordInfo,
  draft: emptyDraft,
  scenario: {
    registry: "available",
    insurance: "normal",
    reporting: "success",
    slots: "available",
    prescription: "available",
  },
  noticeOpened: false,
}
export function ageAt(birthDate: string, date = defaults.referenceDate) {
  return (
    Number(date.slice(0, 4)) -
    Number(birthDate.slice(0, 4)) -
    (date.slice(5) < birthDate.slice(5) ? 1 : 0)
  )
}
export function eligibility(
  location: typeof locations[number],
  child: Child,
  selected: string[],
  prescription = "available",
) {
  const reasons: string[] = []
  const age = ageAt(child.birthDate)
  if (age < location.minAge || age > location.maxAge)
    reasons.push(
      `Sample age range is ${location.minAge}–${location.maxAge}; child is ${age}.`,
    )
  if (selected.some((id) => !location.vaccines.includes(id)))
    reasons.push("Not all selected vaccines are offered in this demo.")
  if (location.prescription && prescription !== "available")
    reasons.push(
      "Sample prescription is unavailable; choose a clinic for review.",
    )
  return reasons
}
export function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}
export function appointmentStatus(a: Appointment) {
  return a.cancelled
    ? "Cancelled"
    : a.referral
      ? "Declined / referred"
      : a.doses.length === a.vaccines.length
        ? "Completed"
        : a.doses.length
          ? "Partially recorded"
          : "Confirmed"
}

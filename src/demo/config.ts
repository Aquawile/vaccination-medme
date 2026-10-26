export type Role = "parent" | "pharmacist" | "administrator"
export const accountRoles: Record<string, Role> = {
  "parent@example.test": "parent",
  "pharmacist@example.test": "pharmacist",
  "admin@example.test": "administrator",
}
export const defaults = {
  referenceDate: "2026-09-08",
  minimumBirthDate: "2005-01-01",
  password: "Demo123!",
  school: "Cedar Grove Elementary",
  pharmacy: "Willow & Pine Pharmacy",
  campaign: "Cedar Grove · Fall 2026",
  recordSource: "Seeded school record extract",
  retrievalDate: "September 7, 2026",
  schools: ["Cedar Grove Elementary", "Fern Valley Elementary"],
  pharmacies: ["Willow & Pine Pharmacy"],
  insuranceResponse:
    "Not checked — sample appointment has confirmed self-pay cost",
}
export const vaccines = [
  {
    id: "dtap",
    name: "DTaP",
    detail: "Diphtheria, tetanus & pertussis",
    dose: "Dose 5",
    earliest: "September 8, 2026",
    earliestDate: "2026-09-08",
  },
  {
    id: "polio",
    name: "IPV",
    detail: "Polio",
    dose: "Dose 4",
    earliest: "September 8, 2026",
    earliestDate: "2026-09-08",
  },
]
export const states = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
]
export const initialData = {
  child: {
    name: "Sam Parker",
    birthDate: "2019-04-15",
    grade: "2",
    school: defaults.school,
  },
  childSaved: false,
  selection: [] as string[],
  reviews: [] as string[],
  doses: [] as {
    id: string
    vaccine: string
    lot: string
    site: string
    time: string
    signature: string
  }[],
  referral: "",
  rules: [
    {
      id: "dtap",
      vaccine: "DTaP",
      requirement: "Sample: 5 doses",
      source: "Placeholder — Oregon state source needed",
      status: "Unverified",
    },
    {
      id: "polio",
      vaccine: "IPV",
      requirement: "Sample: 4 doses",
      source: "Placeholder — Oregon state source needed",
      status: "Unverified",
    },
  ],
  outreach: [] as {
    id: string
    date: string
    audience: string
    studentIds: string[]
    subject: string
    body: string
  }[],
  // DEMO-FAKE: school drives requested by the school nurse (UC-School-01 to 04)
  drives: [] as {
    id: string
    school: string
    pharmacyId: string
    date: string
    startTime: string
    hours: number
    families: number
    status: "accepted" | "declined"
    reason: string
    slots: string[]
  }[],
  // DEMO-FAKE: family ids who answered a notice (W-102)
  noticeReplies: [] as string[],
  // DEMO-FAKE: reviews of state rules saved on this device (W-26)
  ruleReviews: {} as Record<string, { status: string; sourceUrl: string; lastReviewed: string }>,
  ruleLog: [] as { time: string; state: string; text: string }[],
  events: [] as {
    id: string
    text: string
    time: string
    type: string
  }[],
}
export type DemoData = typeof initialData & typeof import("./journey").journeyDefaults

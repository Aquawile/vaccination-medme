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
  events: [] as {
    id: string
    text: string
    time: string
    type: string
  }[],
}
export type DemoData = typeof initialData & typeof import("./journey").journeyDefaults

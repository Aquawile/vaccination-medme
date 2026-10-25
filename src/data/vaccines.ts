export type VaccineInfo = { id: string; name: string; detail: string }
export const vaccineCatalog: VaccineInfo[] = [
  { id: "dtap", name: "DTaP", detail: "Diphtheria, tetanus & pertussis" },
  { id: "polio", name: "IPV", detail: "Polio" },
  { id: "mmr", name: "MMR", detail: "Measles, mumps & rubella" },
  { id: "varicella", name: "Varicella", detail: "Chickenpox" },
]
export const vaccineName = (id: string) =>
  vaccineCatalog.find((v) => v.id === id)?.name ?? id

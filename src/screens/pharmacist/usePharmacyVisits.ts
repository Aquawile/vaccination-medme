import { useMemo } from "react"
import { vaccineName } from "../../data/vaccines"
import { visitsFromRoster, YOU, type Visit } from "../../domain/pharmacyVisits"
import { useDemo } from "../../state"
import { useRoster } from "../admin/roster"

/** Every booked visit at the pharmacy: families booked through the school campaign, plus visits a parent booked in this app. */
export function usePharmacyVisits(): Visit[] {
  const { data } = useDemo()
  const roster = useRoster()
  return useMemo(() => {
    const family = visitsFromRoster(roster)
    const parent: Visit[] = data.appointments
      .filter((a) => !a.seeded && !a.cancelled)
      .map((a) => ({ id: a.id, date: a.date, time: a.time, name: a.child.name, grade: "", vaccines: a.vaccines, origin: "parent" as const, appointmentId: a.id, pharmacist: YOU }))
    return [...family, ...parent].sort((x, y) => `${x.date}${x.time}`.localeCompare(`${y.date}${y.time}`))
  }, [roster, data.appointments])
}
export const vName = (id: string) => vaccineName(id)

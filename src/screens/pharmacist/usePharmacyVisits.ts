import { useMemo } from "react"
import { vaccineName } from "../../data/vaccines"
import { visitsFromRoster, YOU, type Visit } from "../../domain/pharmacyVisits"
import { useDemo } from "../../state"
import { useRoster } from "../admin/roster"

// DEMO-FAKE: fictional cohorts for filter demonstrations (past/today/future, every status).
// Never used for clinical or legal decisions; edits to statuses are local to this browser.
const sampleVisits: Visit[] = [
  { id:"DEMO-PAST-1", date:"2026-09-02", time:"09:00", name:"Avery Moreno", grade:"3", vaccines:["dtap"], origin:"family", pharmacist:YOU, sampleStatus:"completed" },
  { id:"DEMO-PAST-2", date:"2026-09-03", time:"10:30", name:"Noah Chen", grade:"2", vaccines:["polio"], origin:"family", pharmacist:YOU, sampleStatus:"no-show" },
  { id:"DEMO-PAST-3", date:"2026-09-04", time:"13:00", name:"Mia Patel", grade:"4", vaccines:["dtap"], origin:"family", pharmacist:YOU, sampleStatus:"cancelled" },
  { id:"DEMO-PAST-4", date:"2026-09-05", time:"14:00", name:"Sofia Reyes", grade:"1", vaccines:["dtap","polio"], origin:"family", pharmacist:"Priya Raman", sampleStatus:"completed" },
  { id:"DEMO-DAY-1", date:"2026-09-08", time:"08:30", name:"Oliver Brooks", grade:"2", vaccines:["dtap"], origin:"family", pharmacist:YOU, sampleStatus:"booked" },
  { id:"DEMO-DAY-2", date:"2026-09-08", time:"09:00", name:"Isabella Flores", grade:"1", vaccines:["polio"], origin:"family", pharmacist:YOU, sampleStatus:"checked-in" },
  { id:"DEMO-DAY-3", date:"2026-09-08", time:"09:30", name:"Ethan Wright", grade:"4", vaccines:["dtap","polio"], origin:"family", pharmacist:YOU, sampleStatus:"no-show" },
  { id:"DEMO-DAY-4", date:"2026-09-08", time:"10:00", name:"Zoe Kim", grade:"3", vaccines:["polio"], origin:"family", pharmacist:YOU, sampleStatus:"completed" },
  { id:"DEMO-DAY-5", date:"2026-09-08", time:"10:30", name:"Lucas Ahmed", grade:"2", vaccines:["dtap"], origin:"family", pharmacist:YOU, sampleStatus:"cancelled" },
  { id:"DEMO-DAY-6", date:"2026-09-08", time:"11:00", name:"Emma Sullivan", grade:"2", vaccines:["polio"], origin:"family", pharmacist:"Priya Raman", sampleStatus:"booked" },
  { id:"DEMO-DAY-7", date:"2026-09-08", time:"11:30", name:"Liam Foster", grade:"3", vaccines:["dtap"], origin:"family", pharmacist:"Sam Okafor", sampleStatus:"checked-in" },
  { id:"DEMO-FUTURE-1", date:"2026-09-10", time:"09:00", name:"Grace Martin", grade:"1", vaccines:["dtap"], origin:"family", pharmacist:YOU, sampleStatus:"booked" },
  { id:"DEMO-FUTURE-2", date:"2026-09-12", time:"10:00", name:"Leo Ortiz", grade:"5", vaccines:["polio"], origin:"family", pharmacist:YOU, sampleStatus:"booked" },
  { id:"DEMO-FUTURE-3", date:"2026-09-15", time:"13:30", name:"Ruby Thompson", grade:"2", vaccines:["dtap"], origin:"family", pharmacist:"Priya Raman", sampleStatus:"booked" },
]

/** Every booked visit at the pharmacy: families booked through the school campaign, plus visits a parent booked in this app. */
export function usePharmacyVisits(): Visit[] {
  const { data } = useDemo()
  const roster = useRoster()
  return useMemo(() => {
    const family = visitsFromRoster(roster)
    const parent: Visit[] = data.appointments
      .filter((a) => !a.seeded && !a.cancelled)
      .map((a) => ({ id: a.id, date: a.date, time: a.time, name: a.child.name, grade: "", vaccines: a.vaccines, origin: "parent" as const, appointmentId: a.id, pharmacist: YOU }))
    return [...sampleVisits, ...family, ...parent].sort((x, y) => `${x.date}${x.time}`.localeCompare(`${y.date}${y.time}`))
  }, [roster, data.appointments])
}
export const vName = (id: string) => vaccineName(id)

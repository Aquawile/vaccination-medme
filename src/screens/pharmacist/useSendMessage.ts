import { defaults } from "../../demo/config"
import { fillVisit, type Visit } from "../../domain/pharmacyVisits"
import type { Template } from "../../domain/pharmacyTemplates"
import { useDemo } from "../../state"
import { vName } from "./usePharmacyVisits"

/** Records a scheduling message for the given visits. A no-show notice also cancels app bookings that have no doses. */
export function useSendMessage() {
  const { data, update, event } = useDemo()
  const short = data.shortSupply.map(vName).join(", ")
  const fill = (t: string, v: Visit) => fillVisit(t, v, { pharmacy: defaults.pharmacy, vaccineName: vName, short })
  // DEMO-FAKE: nothing is delivered. "Send" records the message so the flow can be shown.
  return function send(key: string, t: Template, recipients: Visit[], auto = false) {
    const m = {
      id: `PM-${data.pharmacyMessages.length + 1}`, date: defaults.referenceDate, kind: t.label, subject: t.subject, body: t.body,
      visitIds: recipients.map((r) => r.id), appointmentIds: recipients.filter((r) => r.appointmentId).map((r) => r.appointmentId!),
      filled: Object.fromEntries(recipients.filter((r) => r.appointmentId).map((r) => [r.appointmentId!, { subject: fill(t.subject, r), body: fill(t.body, r) }])), auto,
    }
    update((d) => ({
      ...d,
      pharmacyMessages: [m, ...d.pharmacyMessages],
      appointments: key === "noshow" ? d.appointments.map((a) => (m.appointmentIds.includes(a.id) && !a.doses.length ? { ...a, cancelled: true } : a)) : d.appointments,
    }))
    event(`Pharmacy message recorded for ${recipients.length} families (simulated)`, "pharmacy-message")
    return m
  }
}

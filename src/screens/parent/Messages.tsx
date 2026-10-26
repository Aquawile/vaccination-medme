import { Badge, Button, Card, Heading } from "../../components/ui"
import { vaccines } from "../../demo/config"
import type { Appointment } from "../../demo/journey"
import { dateLabel } from "../../demo/journey"
import { useDemo } from "../../state"

/** A visit is confirmed once the pharmacist has recorded doses. */
const confirmed = (apps: Appointment[]) => apps.filter((a) => !a.cancelled && a.doses.length > 0)
export const unreadCount = (apps: Appointment[]) => confirmed(apps).filter((a) => !a.parentReceived).length

export default function Messages() {
  const { data, update, event } = useDemo()
  const list = confirmed(data.appointments)
  return (
    <main className="screen">
      <Heading level={1}>Messages</Heading>
      <p className="muted">Visit confirmations from your pharmacy. Marking one received tells the pharmacy you saw it.</p>
      {list.length === 0 ? <Card><p className="empty-inline">No messages yet. A confirmation appears here after a pharmacist records a visit.</p></Card> : list.map((a) => (
        <Card key={a.id}>
          <div className="section-heading">
            <Heading level={2}>Visit confirmed</Heading>
            <Badge kind={a.parentReceived ? "success" : "warning"}>{a.parentReceived ? "Received" : "Unread"}</Badge>
          </div>
          <p>Doses recorded: {a.doses.map((d) => `${vaccines.find((v) => v.id === d.vaccine)?.name} (${dateLabel(d.date)})`).join(", ")}.</p>
          {!a.parentReceived && (
            <div className="action-row">
              <Button onClick={() => { update((d) => ({ ...d, appointments: d.appointments.map((x) => (x.id === a.id ? { ...x, parentReceived: true } : x)) })); event("Parent marked a visit confirmation received", "message") }}>Mark received</Button>
            </div>
          )}
        </Card>
      ))}
    </main>
  )
}

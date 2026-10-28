import { Badge, Button, Card, Check, Heading } from "../../components/ui"
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
      <Card>
        <Heading level={2}>How we may contact you</Heading>
        <p className="muted">Scheduling and records only, never medical advice. Turn either off at any time.</p>
        <Check checked={data.contactPrefs.sms} onChange={(e) => update((d) => ({ ...d, contactPrefs: { ...d.contactPrefs, sms: e.target.checked } }))}>Text messages</Check>
        <Check checked={data.contactPrefs.email} onChange={(e) => update((d) => ({ ...d, contactPrefs: { ...d.contactPrefs, email: e.target.checked } }))}>Email</Check>
      </Card>
      {data.pharmacyMessages.flatMap((m) => Object.entries(m.filled).filter(([id]) => data.appointments.some((a) => a.id === id)).map(([id, f]) => (
        <Card key={`${m.id}-${id}`}>
          <div className="section-heading"><Heading level={2}>{f.subject}</Heading><Badge>From your pharmacy</Badge></div>
          <p className="preview">{f.body}</p>
        </Card>
      )))}
      {data.reminders.length > 0 && (
        <Card>
          <Heading level={2}>Reminders you set</Heading>
          <ul className="link-list">
            {data.reminders.map((r) => <li key={r.id}>{r.child}: {r.vaccine}, earliest date by the sample interval table {dateLabel(r.dueDate)}. {data.contactPrefs.sms || data.contactPrefs.email ? `Sent by ${[data.contactPrefs.sms && "text", data.contactPrefs.email && "email"].filter(Boolean).join(" and ")} (demo).` : "Texts and email are off, so nothing will be sent."}</li>)}
          </ul>
        </Card>
      )}
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

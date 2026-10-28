import { useMemo, useState } from "react"
import { Badge, Button, Card, Field, Heading } from "../../components/ui"
import { defaults } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { addDays } from "../../domain/calendar"
import { dayStats, firstBusyDay, statusOf, type Visit } from "../../domain/pharmacyVisits"
import { useDemo } from "../../state"
import { vName } from "./usePharmacyVisits"

const PAGE = 12
const tone = { booked: "", "checked-in": "warning", completed: "success", "no-show": "warning" } as const

/** One day's visits at a glance. Check in, mark no-shows, and message families who did not come. */
export default function Today({ visits, onOpen, onNotify }: { visits: Visit[]; onOpen: (appointmentId: string) => void; onNotify: (template: string, ids: string[]) => void }) {
  const { data, update, event } = useDemo()
  const [day, setDay] = useState(() => firstBusyDay(visits, defaults.referenceDate))
  const [q, setQ] = useState("")
  const [page, setPage] = useState(0)
  const done = useMemo(() => new Set(data.appointments.filter((a) => a.doses.length >= a.vaccines.length && a.doses.length > 0).map((a) => a.id)), [data.appointments])
  const stats = dayStats(visits, data.visitMarks, day, done)
  const list = visits.filter((v) => v.date === day && `${v.name} ${v.grade}`.toLowerCase().includes(q.trim().toLowerCase()))
  const mark = (v: Visit, status: string) => {
    update((d) => ({ ...d, visitMarks: { ...d.visitMarks, [v.id]: status } }))
    event(`Visit marked ${status}`, "visit")
  }
  const noShows = visits.filter((v) => v.date === day && statusOf(v, data.visitMarks, done.has(v.id)) === "no-show").map((v) => v.id)
  const shift = (n: number) => { setDay(addDays(day, n)); setPage(0) }
  return (
    <>
      <div className="stat-row">
        <div className="stat"><strong>{stats.total}</strong><span>Booked</span></div>
        <div className="stat"><strong>{stats.checkedIn}</strong><span>Checked in</span></div>
        <div className="stat"><strong>{stats.completed}</strong><span>Completed</span></div>
        <div className="stat"><strong>{stats.noShow}</strong><span>No-show</span></div>
      </div>
      <Card className="cal-card">
        <div className="cal-bar">
          <div className="cal-nav">
            <Button variant="secondary" aria-label="Previous day" onClick={() => shift(-1)}>‹</Button>
            <Button variant="secondary" aria-label="Next day" onClick={() => shift(1)}>›</Button>
            <h2 className="cal-title">{dateLabel(day)}</h2>
            <span className="muted">{list.length} visits</span>
          </div>
          <div className="cal-tools">
            {noShows.length > 0 && <Button variant="secondary" onClick={() => onNotify("noshow", noShows)}>Message {noShows.length} no-show{noShows.length > 1 ? "s" : ""}</Button>}
            <Button variant="secondary" onClick={() => onNotify("reminder", visits.filter((v) => v.date === day && statusOf(v, data.visitMarks, done.has(v.id)) === "booked").map((v) => v.id))}>Send reminders for this day</Button>
          </div>
        </div>
        <div className="today-body">
          <Field label="Find a child" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Name" />
          {list.length === 0 ? <p className="empty-state">No visits this day.</p> : (
            <div className="table-scroll"><table className="visit-table">
              <thead><tr><th>Time</th><th>Child</th><th>Vaccines</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {list.slice(page * PAGE, page * PAGE + PAGE).map((v) => {
                  const st = statusOf(v, data.visitMarks, done.has(v.id))
                  return (
                    <tr key={v.id}>
                      <td>{v.time}</td>
                      <td><strong>{v.name}</strong>{v.grade ? <span className="muted"> · Grade {v.grade}</span> : <span className="muted"> · Booked in app</span>}</td>
                      <td>{v.vaccines.length ? v.vaccines.map(vName).join(", ") : "As booked"}</td>
                      <td><Badge kind={tone[st]}>{st === "no-show" ? "No-show" : st === "checked-in" ? "Checked in" : st === "completed" ? "Completed" : "Booked"}</Badge></td>
                      <td className="row-actions">
                        {st === "booked" && <Button variant="secondary" onClick={() => mark(v, "checked-in")}>Check in</Button>}
                        {st === "booked" && <Button variant="text" onClick={() => mark(v, "no-show")}>No-show</Button>}
                        {st === "checked-in" && <Button variant="secondary" onClick={() => (v.appointmentId ? onOpen(v.appointmentId) : mark(v, "completed"))}>{v.appointmentId ? "Record dose" : "Mark completed"}</Button>}
                        {st === "no-show" && <Button variant="secondary" onClick={() => onNotify("noshow", [v.id])}>Message family</Button>}
                        {v.appointmentId && st !== "booked" && st !== "checked-in" && <Button variant="text" onClick={() => onOpen(v.appointmentId!)}>Open</Button>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table></div>
          )}
          {list.length > PAGE && (
            <div className="pager">
              <span className="muted">{page * PAGE + 1} to {Math.min(list.length, (page + 1) * PAGE)} of {list.length}</span>
              <span className="action-row" style={{ margin: 0 }}>
                <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Back</Button>
                <Button variant="secondary" disabled={(page + 1) * PAGE >= list.length} onClick={() => setPage(page + 1)}>More</Button>
              </span>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}

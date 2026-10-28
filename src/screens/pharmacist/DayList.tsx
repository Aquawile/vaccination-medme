import { useMemo, useState } from "react"
import { Alert, Badge, Button, Card, Field } from "../../components/ui"
import { dateLabel } from "../../demo/journey"
import { overlapping, statusOf, YOU, type Visit } from "../../domain/pharmacyVisits"
import { builtInTemplates } from "../../domain/pharmacyTemplates"
import { useDemo } from "../../state"
import { useSendMessage } from "./useSendMessage"
import { vName } from "./usePharmacyVisits"

const PAGE = 20
const tone = { booked: "", "checked-in": "warning", completed: "success", "no-show": "warning", cancelled: "warning" } as const

/** One day's visits at a glance. Check in, mark no-shows, and message families who did not come. */
export default function DayList({ visits: allVisits, day, showAll, onShowAll, onOpen, onNotify }: { visits: Visit[]; day: string; showAll: boolean; onShowAll: (v: boolean) => void; onOpen: (appointmentId: string) => void; onNotify: (template: string, ids: string[]) => void }) {
  const { data, update, event } = useDemo()
  const visits = useMemo(() => allVisits.filter((v) => showAll || v.pharmacist === YOU), [allVisits, showAll])
  const within = (v: Visit) => v.date === day
  const hidden = allVisits.filter((v) => within(v) && v.pharmacist !== YOU).length
  const send = useSendMessage()
  const [q, setQ] = useState("")
  const [page, setPage] = useState(0)
  const done = useMemo(() => new Set(data.appointments.filter((a) => a.doses.length >= a.vaccines.length && a.doses.length > 0).map((a) => a.id)), [data.appointments])
  const todayVisits = visits.filter(within)
  const stats = { total: todayVisits.length, checkedIn: todayVisits.filter((v) => statusOf(v,data.visitMarks,done.has(v.id)) === "checked-in").length, completed: todayVisits.filter((v) => statusOf(v,data.visitMarks,done.has(v.id)) === "completed").length, noShow: todayVisits.filter((v) => statusOf(v,data.visitMarks,done.has(v.id)) === "no-show").length }
  const list = visits.filter((v) => within(v) && `${v.name} ${v.grade}`.toLowerCase().includes(q.trim().toLowerCase()))
  const lastPage = Math.max(0, Math.ceil(list.length / PAGE) - 1)
  const visiblePage = Math.min(page, lastPage)
  const mark = (v: Visit, status: string) => {
    update((d) => ({ ...d, visitMarks: { ...d.visitMarks, [v.id]: status } }))
    event(`Visit marked ${status}`, "visit")
    // DEMO-FAKE: with automatic no-show notices on, the notice is recorded right away instead of waiting for the pharmacist.
    if (status === "no-show" && data.reminderRule.autoNoShow) send("noshow", builtInTemplates.noshow, [v], true)
  }
  const cancel = (v: Visit) => {
    update((d) => ({...d,visitMarks:{...d.visitMarks,[v.id]:"cancelled"},appointments:v.appointmentId?d.appointments.map((a)=>a.id===v.appointmentId && !a.doses.length?{...a,cancelled:true}:a):d.appointments}))
    event("Demo appointment cancelled for "+v.name,"visit")
  }
  const restore = (v: Visit) => {
    update((d)=>({...d,visitMarks:{...d.visitMarks,[v.id]:"booked"},appointments:v.appointmentId?d.appointments.map((a)=>a.id===v.appointmentId?{...a,cancelled:false}:a):d.appointments}))
    event("Demo appointment restored for "+v.name,"visit")
  }
  const noShows = visits.filter((v) => within(v) && statusOf(v, data.visitMarks, done.has(v.id)) === "no-show").map((v) => v.id)
  return (
    <>
      {!showAll && hidden > 0 && <Alert>{hidden} other appointment{hidden > 1 ? "s" : ""} during this period belong{hidden > 1 ? "" : "s"} to other pharmacists, so they are not listed here. <Button variant="text" onClick={() => onShowAll(true)}>Show everyone</Button></Alert>}
      <div className="pharmacy-period-tools"><strong>Check-in & attendance · {dateLabel(day)}</strong><span className="muted">Select another day using the calendar. Only visits on this date are actionable here.</span></div>
      <div className="stat-row">
        <div className="stat"><strong>{stats.total}</strong><span>Appointments</span></div>
        <div className="stat"><strong>{stats.checkedIn}</strong><span>Checked in</span></div>
        <div className="stat"><strong>{stats.completed}</strong><span>Completed</span></div>
        <div className="stat"><strong>{stats.noShow}</strong><span>No-show</span></div>
      </div>
      <Card className="cal-card">
        <div className="cal-bar">
          <div className="cal-nav">
            <h2 className="cal-title">{dateLabel(day)}</h2>
            <span className="muted">{list.length} visits</span>
          </div>
          <div className="cal-tools">
            {noShows.length > 0 && <Button variant="secondary" onClick={() => onNotify("noshow", noShows)}>Message {noShows.length} no-show{noShows.length > 1 ? "s" : ""}</Button>}
            <Button variant="secondary" onClick={() => onNotify("reminder", visits.filter((v) => within(v) && statusOf(v, data.visitMarks, done.has(v.id)) === "booked").map((v) => v.id))}>Prepare reminders for this day</Button>
          </div>
        </div>
        <div className="today-body">
          <Field label="Find a child" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Name" />
          {list.length === 0 ? <p className="empty-state">No visits on the selected date.</p> : (
            <div className="table-scroll"><table className="visit-table">
              <thead><tr><th>Date</th><th>Time</th><th>Child</th><th>Vaccines</th>{showAll && <th>With</th>}<th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {list.slice(visiblePage * PAGE, visiblePage * PAGE + PAGE).map((v) => {
                  const st = statusOf(v, data.visitMarks, done.has(v.id))
                  return (
                    <tr key={v.id}>
                      <td>{dateLabel(v.date)}</td><td>{v.time}</td>
                      <td><strong>{v.name}</strong>{v.grade ? <span className="muted"> · Grade {v.grade}</span> : <span className="muted"> · Booked in app</span>}</td>
                      <td>{v.vaccines.length ? v.vaccines.map(vName).join(", ") : "As booked"}</td>
                      {showAll && <td>{v.pharmacist === YOU ? "You" : v.pharmacist}</td>}
                      <td><Badge kind={tone[st]}>{st === "no-show" ? "No-show" : st === "checked-in" ? "Checked in" : st === "completed" ? "Completed" : st === "cancelled" ? "Cancelled" : "Booked"}</Badge></td>
                      <td className="row-actions">
                        {overlapping(allVisits, v).length > 0 && <span className="muted" title="Another visit starts at this time">+{overlapping(allVisits, v).length} at {v.time}</span>}
                        {st === "booked" && <Button variant="secondary" onClick={() => mark(v, "checked-in")}>Check in</Button>}
                        {st === "booked" && <Button variant="text" onClick={() => mark(v, "no-show")}>No-show</Button>}{st === "booked" && <Button variant="text" onClick={() => cancel(v)}>Cancel</Button>}
                        {(st === "cancelled" || st === "no-show") && <Button variant="text" onClick={() => restore(v)}>Restore booking</Button>}
                        {st === "checked-in" && <Button variant="secondary" onClick={() => (v.appointmentId ? onOpen(v.appointmentId) : mark(v, "completed"))}>{v.appointmentId ? "Record dose" : "Mark completed"}</Button>}
                        <Button variant="text" onClick={() => onNotify(st === "no-show" ? "noshow" : "reminder", [v.id])}>Message family</Button>
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
              <span className="muted">{visiblePage * PAGE + 1} to {Math.min(list.length, (visiblePage + 1) * PAGE)} of {list.length}</span>
              <span className="action-row" style={{ margin: 0 }}>
                <Button variant="secondary" disabled={visiblePage === 0} onClick={() => setPage(visiblePage - 1)}>Back</Button>
                <Button variant="secondary" disabled={(visiblePage + 1) * PAGE >= list.length} onClick={() => setPage(visiblePage + 1)}>More</Button>
              </span>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}

import { useMemo, useState } from "react"
import { Alert, Button, Card, Field } from "../../components/ui"
import calendarMock from "../../data/calendarMock.json"
import { stateName } from "../../data/states"
import { defaults } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { addDays, buildEvents, countsByDay, monthGrid, weekOf, type CalEvent, type CalType } from "../../domain/calendar"
import type { StudentSummary } from "../../domain/cohorts"
import { allDrivePharmacies } from "../../domain/drives"
import type { Visit } from "../../domain/pharmacyVisits"
import { allKeyDates } from "../../domain/keyDates"
import { useDemo } from "../../state"

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const label: Record<CalType, string> = { visit: "Visits", notice: "Notices", deadline: "Dates" }
const one: Record<CalType, string> = { visit: "Visit", notice: "Notice", deadline: "Date" }
const PAGE = 10
// DEMO-FAKE: sample notices and dates so the calendar has realistic content. Not legal deadlines.
const mock = calendarMock as CalEvent[]

/** One place for everything with a date. Visits and follow-ups come from MedMe's scheduling system (mocked here). */
export default function Calendar({ summaries, state, onOpen, variant = "school", visits = [] }: { summaries: StudentSummary[]; state: string; onOpen: (id: string) => void; variant?: "school" | "pharmacy"; visits?: Visit[] }) {
  const { data } = useDemo()
  const today = defaults.referenceDate
  const [view, setView] = useState<"month" | "week">("month")
  const [day, setDay] = useState(() => (variant === "pharmacy" ? (visits.map((v) => v.date).filter((d) => d >= today).sort()[0] ?? today) : today))
  const [on, setOn] = useState<Record<CalType, boolean>>({ visit: true, notice: true, deadline: true })
  const [q, setQ] = useState("")
  const [page, setPage] = useState(0)
  const clinics: CalEvent[] = data.drives.filter((d) => d.status === "accepted").map((d) => ({
    date: d.date, type: "visit", title: `Clinic at ${d.school}`, detail: `${allDrivePharmacies.find((p) => p.id === d.pharmacyId)?.name ?? "Pharmacy"}, ${d.startTime}, ${d.hours} hours`,
  }))
  const pharmacy = variant === "pharmacy"
  const pharmacyEvents: CalEvent[] = useMemo(() => [
    ...visits.map((v): CalEvent => ({ date: v.date, type: "visit", title: v.name, detail: `${v.time} · ${v.vaccines.length ? v.vaccines.join(", ") : "As booked"}${data.visitMarks[v.id] ? ` · ${data.visitMarks[v.id]}` : ""}` })),
    ...data.pharmacyMessages.map((m): CalEvent => ({ date: m.date, type: "notice", title: m.kind, detail: `Sent to ${m.visitIds.length} families` })),
  ], [visits, data.visitMarks, data.pharmacyMessages])
  const all = useMemo(() => (pharmacy ? pharmacyEvents : buildEvents(summaries, data.outreach, allKeyDates, state, [...mock, ...clinics])), [pharmacy, pharmacyEvents, summaries, data.outreach, state, clinics.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const events = useMemo(() => all.filter((e) => on[e.type]), [all, on])
  const counts = useMemo(() => countsByDay(events), [events])
  const year = Number(day.slice(0, 4)), month = Number(day.slice(5, 7)) - 1
  const week = weekOf(day)
  const dayEvents = events.filter((e) => e.date === day && (!q.trim() || `${e.title} ${e.detail}`.toLowerCase().includes(q.trim().toLowerCase())))
  const pick = (d: string) => { setDay(d); setPage(0); setQ("") }
  const shift = (n: number) => {
    if (view === "week") return pick(addDays(day, n * 7))
    const d = new Date(Date.UTC(year, month + n, 1))
    pick(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`)
  }
  const title = view === "month" ? `${months[month]} ${year}` : `${dateLabel(week[0])} to ${dateLabel(week[6])}`
  const monthTotal = events.filter((e) => e.date.startsWith(day.slice(0, 7))).length
  return (
    <>
      {!pharmacy && <Alert>Visits, notices and follow-ups come from MedMe's scheduling and follow-up system. This calendar is a mock of that view. Dates marked "Sample" are not legal deadlines; read {stateName(state)}'s own pages in Settings.</Alert>}
      <Card className="cal-card">
        <div className="cal-bar">
          <div className="cal-nav">
            <Button variant="secondary" aria-label="Previous" onClick={() => shift(-1)}>‹</Button>
            <Button variant="secondary" aria-label="Next" onClick={() => shift(1)}>›</Button>
            <Button variant="secondary" onClick={() => pick(today)}>Today</Button>
            <h2 className="cal-title">{title}</h2>
            <span className="muted">{view === "month" ? `${monthTotal} items` : ""}</span>
          </div>
          <div className="cal-tools">
            <div className="seg" role="group" aria-label="Calendar view">
              {(["month", "week"] as const).map((v) => <button key={v} aria-pressed={view === v} className={view === v ? "active" : ""} onClick={() => setView(v)}>{v === "month" ? "Month" : "Week"}</button>)}
            </div>
            <div className="seg" role="group" aria-label="Show on calendar">
              {(Object.keys(label) as CalType[]).filter((t) => !pharmacy || t !== "deadline").map((t) => <button key={t} aria-pressed={on[t]} className={`${on[t] ? "active" : ""} ${t}`} onClick={() => { setOn({ ...on, [t]: !on[t] }); setPage(0) }}><i className={`ev-dot ${t}`} />{label[t]}</button>)}
            </div>
          </div>
        </div>
        <div className="cal-body">
          {view === "month" ? (
            <div className="cal-grid" role="grid" aria-label={title}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="cal-head" role="columnheader">{d}</div>)}
              {monthGrid(year, month).flat().map(({ date, inMonth }) => {
                const c = counts.get(date)
                return (
                  <button key={date} role="gridcell" className={`cal-day ${inMonth ? "" : "outside"} ${date === day ? "selected" : ""} ${date === today ? "today" : ""}`} aria-label={`${dateLabel(date)}${c ? `, ${c.visit} visits, ${c.notice} notices, ${c.deadline} dates` : ""}`} onClick={() => pick(date)}>
                    <span className="cal-num">{Number(date.slice(8))}</span>
                    {c && <span className="cal-pills">{(["deadline", "notice", "visit"] as CalType[]).filter((t) => c[t]).map((t) => <span key={t} className={`pill ${t}`}><i className={`ev-dot ${t}`} />{c[t]}</span>)}</span>}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="week-grid">
              {week.map((d) => {
                const list = events.filter((e) => e.date === d)
                return (
                  <div key={d} className={`week-col ${d === day ? "selected" : ""} ${d === today ? "today" : ""}`}>
                    <button className="week-head" onClick={() => pick(d)}><span>{new Date(`${d}T00:00:00Z`).toUTCString().slice(0, 3)}</span><strong>{Number(d.slice(8))}</strong></button>
                    <ul>
                      {list.slice(0, 5).map((e, i) => <li key={i} className={e.type} title={`${e.title}. ${e.detail}`}><i className={`ev-dot ${e.type}`} />{e.title}</li>)}
                      {list.length > 5 && <li><button className="more" onClick={() => pick(d)}>+{list.length - 5} more</button></li>}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
          <aside className="day-panel" aria-label="Selected day">
            <div className="day-head">
              <strong>{dateLabel(day)}</strong>
              <span className="muted">{dayEvents.length} items</span>
            </div>
            {dayEvents.length > PAGE || q ? <Field label="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Name or title" /> : null}
            {dayEvents.length === 0 ? <p className="empty-state">Nothing scheduled.</p> : (
              <ul className="day-rows">
                {dayEvents.slice(page * PAGE, page * PAGE + PAGE).map((e, i) => (
                  <li key={`${e.title}-${i}`}>
                    <i className={`ev-dot ${e.type}`} aria-label={one[e.type]} />
                    <div><strong>{e.title}</strong><span>{e.detail}</span></div>
                    {e.studentId ? <button className="link-button" onClick={() => onOpen(e.studentId!)}>Open</button> : e.sourceUrl ? <a href={e.sourceUrl} target="_blank" rel="noreferrer">Source</a> : null}
                  </li>
                ))}
              </ul>
            )}
            {dayEvents.length > PAGE && (
              <div className="pager"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Back</Button><Button variant="secondary" disabled={(page + 1) * PAGE >= dayEvents.length} onClick={() => setPage(page + 1)}>More</Button></div>
            )}
          </aside>
        </div>
      </Card>
    </>
  )
}

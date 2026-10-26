import { useMemo, useState } from "react"
import { Alert, Badge, Button, Card, Field, Heading } from "../../components/ui"
import { stateName } from "../../data/states"
import { defaults } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { buildEvents, countsByDay, monthGrid, type CalType } from "../../domain/calendar"
import type { StudentSummary } from "../../domain/cohorts"
import { allKeyDates } from "../../domain/keyDates"
import { useDemo } from "../../state"

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const label: Record<CalType, string> = { visit: "Visits", notice: "Notices sent", deadline: "State dates" }
const PAGE = 15

/** Everything with a date in one place. Visits and reminders come from the MedMe scheduling system (mocked here). */
export default function Calendar({ summaries, state, onOpen }: { summaries: StudentSummary[]; state: string; onOpen: (id: string) => void }) {
  const { data } = useDemo()
  const today = defaults.referenceDate
  const [year, setYear] = useState(Number(today.slice(0, 4)))
  const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1)
  const [day, setDay] = useState(today)
  const [on, setOn] = useState<Record<CalType, boolean>>({ visit: true, notice: true, deadline: true })
  const [q, setQ] = useState("")
  const [page, setPage] = useState(0)
  const events = useMemo(() => buildEvents(summaries, data.outreach, allKeyDates, state).filter((e) => on[e.type]), [summaries, data.outreach, state, on])
  const counts = useMemo(() => countsByDay(events), [events])
  const grid = monthGrid(year, month)
  const dayEvents = events.filter((e) => e.date === day && (!q.trim() || `${e.title} ${e.detail}`.toLowerCase().includes(q.trim().toLowerCase())))
  const shift = (n: number) => {
    const d = new Date(Date.UTC(year, month + n, 1))
    setYear(d.getUTCFullYear()); setMonth(d.getUTCMonth())
  }
  const upcoming = events.filter((e) => e.date >= today && e.type === "deadline").slice(0, 3)
  return (
    <>
      <Alert>Visits and reminders come from MedMe's scheduling and follow-up system. This calendar is a mock of that view. {upcoming.length > 0 && <>Next state dates for {stateName(state)}: {upcoming.map((u) => `${u.title} (${dateLabel(u.date)})`).join("; ")}.</>}</Alert>
      <div className="calendar-layout">
        <Card>
          <div className="section-heading">
            <Heading level={2}>{months[month]} {year}</Heading>
            <span className="action-row" style={{ margin: 0 }}>
              <Button variant="secondary" aria-label="Previous month" onClick={() => shift(-1)}>Previous</Button>
              <Button variant="secondary" onClick={() => { setYear(Number(today.slice(0, 4))); setMonth(Number(today.slice(5, 7)) - 1); setDay(today) }}>Today</Button>
              <Button variant="secondary" aria-label="Next month" onClick={() => shift(1)}>Next</Button>
            </span>
          </div>
          <div className="chip-row" role="group" aria-label="Show on calendar">
            {(Object.keys(label) as CalType[]).map((t) => (
              <button key={t} className={`filter-chip ${t} ${on[t] ? "active" : ""}`} aria-pressed={on[t]} onClick={() => { setOn({ ...on, [t]: !on[t] }); setPage(0) }}>{label[t]}</button>
            ))}
          </div>
          <div className="cal-grid" role="grid" aria-label={`${months[month]} ${year}`}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="cal-head" role="columnheader">{d}</div>)}
            {grid.flat().map(({ date, inMonth }) => {
              const c = counts.get(date)
              return (
                <button key={date} role="gridcell" className={`cal-day ${inMonth ? "" : "outside"} ${date === day ? "selected" : ""} ${date === today ? "today" : ""}`} aria-label={`${dateLabel(date)}${c ? `, ${c.visit} visits, ${c.notice} notices, ${c.deadline} state dates` : ""}`} onClick={() => { setDay(date); setPage(0); setQ("") }}>
                  <span className="cal-num">{Number(date.slice(8))}</span>
                  {c?.deadline ? <i className="dot deadline">State date</i> : null}
                  {c?.visit ? <i className="dot visit">{c.visit} visit{c.visit > 1 ? "s" : ""}</i> : null}
                  {c?.notice ? <i className="dot notice">{c.notice} notice{c.notice > 1 ? "s" : ""}</i> : null}
                </button>
              )
            })}
          </div>
        </Card>
        <Card>
          <Heading level={2}>{dateLabel(day)}</Heading>
          <Field label="Search this day" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Name or title" />
          {dayEvents.length === 0 ? (
            <p className="empty-state">Nothing scheduled this day.</p>
          ) : (
            <ul className="day-list">
              {dayEvents.slice(page * PAGE, page * PAGE + PAGE).map((e, i) => (
                <li key={`${e.title}-${i}`}>
                  <Badge kind={e.type === "deadline" ? "warning" : ""}>{label[e.type].replace("Notices sent", "Notice").replace("Visits", "Visit")}</Badge>
                  <div>
                    <strong>{e.title}</strong>
                    <p className="muted">{e.detail}</p>
                    {e.sourceUrl && <a href={e.sourceUrl} target="_blank" rel="noreferrer">Official source</a>}
                    {e.studentId && <Button variant="secondary" onClick={() => onOpen(e.studentId!)}>Open student</Button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="pager">
            <span className="muted">{dayEvents.length} items</span>
            <span className="action-row" style={{ margin: 0 }}>
              <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="secondary" disabled={(page + 1) * PAGE >= dayEvents.length} onClick={() => setPage(page + 1)}>Next</Button>
            </span>
          </div>
        </Card>
      </div>
    </>
  )
}

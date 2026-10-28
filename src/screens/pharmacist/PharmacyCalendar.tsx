import { useMemo, useState } from "react"
import { Button, Card, Check } from "../../components/ui"
import { defaults } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { addDays, monthGrid, weekOf } from "../../domain/calendar"
import { statusOf, YOU, type Visit } from "../../domain/pharmacyVisits"
import { useDemo } from "../../state"
import { vName } from "./usePharmacyVisits"

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16]
const PX = 56 // height of one hour in the week grid
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const short = (name: string) => { const p = name.split(" "); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : name }

type Mode = "month" | "week"

/** The pharmacy's own calendar. Month shows chips, week and day show a time grid. Appointments belonging to other pharmacists can be shown or hidden. */
export default function PharmacyCalendar({ visits, day, onDay, onPick, showAll, onShowAll }: { visits: Visit[]; day: string; onDay: (d: string) => void; onPick: (id: string) => void; showAll: boolean; onShowAll: (v: boolean) => void }) {
  const { data } = useDemo()
  const today = defaults.referenceDate
  const [mode, setMode] = useState<Mode>("week")
  const shown = useMemo(() => visits.filter((v) => showAll || v.pharmacist === YOU), [visits, showAll])
  const byDay = useMemo(() => {
    const m = new Map<string, Visit[]>()
    shown.forEach((v) => m.set(v.date, [...(m.get(v.date) ?? []), v]))
    m.forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)))
    return m
  }, [shown])
  const year = Number(day.slice(0, 4)), month = Number(day.slice(5, 7)) - 1
  const week = weekOf(day)
  const shift = (n: number) => {
    if (mode === "week") return onDay(addDays(day, n * 7))
    const d = new Date(Date.UTC(year, month + n, 1))
    onDay(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`)
  }
  const title = mode === "month" ? `${months[month]} ${year}` : `${dateLabel(week[0])} to ${dateLabel(week[6])}`
  const cls = (v: Visit) => {
    const st = statusOf(v, data.visitMarks)
    return `ev ${v.pharmacist === YOU ? "mine" : "other"} ${st}`
  }
  const chip = (v: Visit, withTime = true) => (
    <button key={v.id} className={cls(v)} title={`${v.time} ${v.name}, ${v.vaccines.map(vName).join(", ") || "as booked"}, with ${v.pharmacist}`} onClick={(e) => { e.stopPropagation(); onDay(v.date); if (v.appointmentId) onPick(v.appointmentId) }}>
      {withTime && <b>{v.time}</b>} {short(v.name)}{v.pharmacist !== YOU && <i> · {v.pharmacist.split(" ")[0]}</i>}
    </button>
  )
  const grid = (days: string[]) => (
    <div className="tg" style={{ ["--cols" as string]: days.length }}>
      <div className="tg-head"><span />{days.map((d) => <button key={d} className={`${d === day ? "selected" : ""} ${d === today ? "today" : ""}`} onClick={() => onDay(d)}><span>{new Date(`${d}T00:00:00Z`).toUTCString().slice(0, 3)}</span><strong>{Number(d.slice(8))}</strong></button>)}</div>
      <div className="tg-body" style={{ height: HOURS.length * PX }}>
        <div className="tg-hours">{HOURS.map((h) => <span key={h} style={{ height: PX }}>{h > 12 ? h - 12 : h} {h >= 12 ? "PM" : "AM"}</span>)}</div>
        {days.map((d) => (
          <div key={d} className="tg-col" onClick={() => onDay(d)}>
            {HOURS.map((h) => <div key={h} className="tg-line" style={{ height: PX }} />)}
            {(byDay.get(d) ?? []).map((v) => {
              const top = ((minutes(v.time) - HOURS[0] * 60) / 60) * PX
              return <button key={v.id} className={`${cls(v)} block`} style={{ top, height: PX / 2 - 2 }} title={`${v.time} ${v.name} with ${v.pharmacist}`} onClick={(e) => { e.stopPropagation(); onDay(d); if (v.appointmentId) onPick(v.appointmentId) }}><b>{v.time}</b> {short(v.name)}{v.pharmacist !== YOU && <i> · {v.pharmacist.split(" ")[0]}</i>}</button>
            })}
          </div>
        ))}
      </div>
    </div>
  )
  return (
    <Card className="cal-card pharmacy-planner">
      <div className="cal-bar">
        <div className="cal-nav">
          <Button variant="secondary" onClick={() => onDay(today)}>Today</Button>
          <Button variant="secondary" aria-label="Previous" onClick={() => shift(-1)}>‹</Button>
          <Button variant="secondary" aria-label="Next" onClick={() => shift(1)}>›</Button>
          <h2 className="cal-title">{title}</h2>
        </div>
        <div className="cal-tools">
          <Check checked={showAll} onChange={(e) => onShowAll(e.target.checked)}>Show all pharmacists</Check>
          <div className="seg" role="group" aria-label="Calendar view">
            {(["week", "month"] as const).map((v) => <button key={v} aria-pressed={mode === v} className={mode === v ? "active" : ""} onClick={() => setMode(v)}>{v === "month" ? "Month" : "Week"}</button>)}
          </div>
        </div>
      </div>
      <div className="cal-body no-panel">
        {mode === "month" ? (
          <div className="cal-grid" role="grid" aria-label={title}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="cal-head" role="columnheader">{d}</div>)}
            {monthGrid(year, month).flat().map(({ date, inMonth }) => {
              const list = byDay.get(date) ?? []
              return (
                <div key={date} role="gridcell" tabIndex={0} className={`cal-day tall ${inMonth ? "" : "outside"} ${date === day ? "selected" : ""} ${date === today ? "today" : ""}`} aria-label={`${dateLabel(date)}, ${list.length} visits`} onClick={() => onDay(date)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDay(date) } }}>
                  <span className="cal-num">{Number(date.slice(8))}</span>
                  <span className="chips">
                    {list.slice(0, 2).map((v) => chip(v))}
                    {list.length > 2 && <button className="more" onClick={(e) => { e.stopPropagation(); setMode("week"); onDay(date) }}>+{list.length - 2} more · view day</button>}
                  </span>
                </div>
              )
            })}
          </div>
        ) : grid(week)}
      </div>
      <p className="cal-legend muted">
        <span className="ev mine sample">Yours</span> <span className="ev other sample">Another pharmacist</span> Completed visits are struck through, no-shows are dashed.
      </p>
    </Card>
  )
}

import { useState } from "react"
import { Badge, Card, Heading, Icon, Select } from "../../components/ui"
import { vaccines } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { useDemo } from "../../state"

/** What is on record. Separate from "Doses to review", which is what a school lists as missing. */
export default function Records() {
  const { data } = useDemo()
  const [filter, setFilter] = useState("all")
  const rows = data.appointments
    .flatMap((a) => a.doses.map((d) => ({ d, source: a.recordSource })))
    .filter((r) => filter === "all" || r.d.vaccine === filter)
    .sort((x, y) => y.d.date.localeCompare(x.d.date))
  return (
    <main className="screen">
      <Heading level={1}>Records</Heading>
      <p className="muted">What is recorded for your child, and where each entry came from. Getting a record and what is missing are on Child & requirements.</p>
      <Card className="history-card">
        <div className="section-heading">
          <Heading level={2}>History</Heading>
          <Badge>{rows.length} shown</Badge>
        </div>
        <div className="controls">
          <Select label="Vaccine" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All vaccines</option>
            {vaccines.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </Select>
        </div>
        {rows.length === 0 ? <p className="empty-inline">No administered doses saved yet.</p> : (
          <div className="history-list">
            {rows.map(({ d, source }) => (
              <div className="history-row" key={d.id}>
                <span className="history-check"><Icon name="check" size={15} /></span>
                <div>
                  <strong>{vaccines.find((v) => v.id === d.vaccine)?.name} administered</strong>
                  <small>{dateLabel(d.date)} · Lot {d.lot} · {d.signature} · Source: {source}</small>
                </div>
                <Badge kind={d.reported ? "success" : ""}>{d.reported ? "Reported" : "Saved locally"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  )
}

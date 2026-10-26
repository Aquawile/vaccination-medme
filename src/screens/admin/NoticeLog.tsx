import { useMemo, useState } from "react"
import { Badge, Button, Card, Heading, Select } from "../../components/ui"
import type { StudentSummary } from "../../domain/cohorts"
import { dateLabel } from "../../demo/journey"
import { useDemo } from "../../state"

type Status = "booked" | "replied" | "waiting"
const label: Record<Status, string> = { booked: "Visit booked", replied: "Replied", waiting: "No reply yet" }
const PAGE = 20

/** One row per family who was sent a notice, with where they are now. */
export default function NoticeLog({ summaries }: { summaries: StudentSummary[] }) {
  const { data, update } = useDemo()
  const [filter, setFilter] = useState("all")
  const [shown, setShown] = useState(PAGE)
  const byId = useMemo(() => new Map(summaries.map((s) => [s.student.id, s])), [summaries])
  const rows = useMemo(() => {
    const seen = new Set<string>()
    const out: { s: StudentSummary; date: string; status: Status }[] = []
    for (const b of [...data.outreach].reverse()) // oldest first so the first notice date wins
      for (const id of b.studentIds) {
        const s = byId.get(id)
        if (!s || seen.has(id)) continue
        seen.add(id)
        const status: Status = s.student.visitDate ? "booked" : data.noticeReplies.includes(id) ? "replied" : "waiting"
        out.push({ s, date: b.date, status })
      }
    return out
  }, [data.outreach, data.noticeReplies, byId])
  const counts = { booked: 0, replied: 0, waiting: 0 }
  rows.forEach((r) => (counts[r.status] += 1))
  const visible = rows.filter((r) => filter === "all" || r.status === filter)
  const toggle = (id: string) =>
    update((d) => ({ ...d, noticeReplies: d.noticeReplies.includes(id) ? d.noticeReplies.filter((x) => x !== id) : [...d.noticeReplies, id] }))
  return (
    <Card style={{ marginTop: "var(--space-5)" }}>
      <div className="section-heading">
        <div>
          <Heading level={2}>Notice tracking</Heading>
          <p className="muted">Who was sent a notice and where they are now. Replies are recorded by hand in this demo.</p>
        </div>
        <Badge>{rows.length} families</Badge>
      </div>
      {rows.length === 0 ? (
        <p className="muted">No notices sent yet. Send one above and it shows up here.</p>
      ) : (
        <>
          <Select label="Show" value={filter} onChange={(e) => { setFilter(e.target.value); setShown(PAGE) }}>
            <option value="all">Everyone ({rows.length})</option>
            {(Object.keys(label) as Status[]).map((k) => <option key={k} value={k}>{label[k]} ({counts[k]})</option>)}
          </Select>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Student</th><th>Grade</th><th>Notice sent</th><th>Status</th><th>Reply</th></tr></thead>
              <tbody>
                {visible.slice(0, shown).map(({ s, date, status }) => (
                  <tr key={s.student.id}>
                    <td>{s.student.name}</td><td>{s.student.grade}</td><td>{dateLabel(date)}</td>
                    <td>{label[status]}</td>
                    <td>{status !== "booked" && <Button variant="secondary" onClick={() => toggle(s.student.id)}>{status === "replied" ? "Undo reply" : "Mark replied"}</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visible.length > shown && <Button variant="secondary" onClick={() => setShown(shown + PAGE)}>Show more ({visible.length - shown} left)</Button>}
        </>
      )}
    </Card>
  )
}

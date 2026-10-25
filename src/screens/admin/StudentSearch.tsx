import { useId, useMemo, useState } from "react"
import { StatusBadge } from "../../components/ui"
import type { StudentSummary } from "../../domain/cohorts"
import { vaccineName } from "../../data/vaccines"

/** Search box for every admin screen: name parts in any order, student ID. Results show status inline. */
export default function StudentSearch({ summaries, onOpen }: { summaries: StudentSummary[]; onOpen: (id: string) => void }) {
  const id = useId()
  const [q, setQ] = useState("")
  const [index, setIndex] = useState(0)
  const results = useMemo(() => {
    const parts = q.toLowerCase().split(/\s+/).filter(Boolean)
    if (!parts.length) return []
    return summaries
      .filter((s) => parts.every((p) => `${s.student.name} ${s.student.id}`.toLowerCase().includes(p)))
      .slice(0, 8)
  }, [q, summaries])
  const open = (sid: string) => {
    setQ("")
    onOpen(sid)
  }
  return (
    <div className="global-search" role="search">
      <div className="field">
        <label htmlFor={id}>Find a student</label>
        <input
          id={id}
          value={q}
          placeholder="Name or student ID"
          autoComplete="off"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={`${id}-list`}
          onChange={(e) => { setQ(e.target.value); setIndex(0) }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setIndex(Math.min(index + 1, results.length - 1)) }
            if (e.key === "ArrowUp") { e.preventDefault(); setIndex(Math.max(index - 1, 0)) }
            if (e.key === "Enter" && results[index]) open(results[index].student.id)
            if (e.key === "Escape") setQ("")
          }}
        />
      </div>
      {q && (
        <ul className="search-results" id={`${id}-list`} role="listbox">
          {results.length === 0 && <li style={{ padding: "10px 12px", fontSize: 12 }}>No student matches.</li>}
          {results.map((r, i) => (
            <li key={r.student.id} role="option" aria-selected={i === index}>
              <button aria-selected={i === index} onClick={() => open(r.student.id)}>
                <strong>{r.student.name}</strong>
                <small>{r.student.school} · Grade {r.student.grade} · {r.student.id}{r.missing.length ? ` · missing ${r.missing.map(vaccineName).join(", ")}` : ""}</small>
                <StatusBadge status={r.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

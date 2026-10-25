import { useState } from "react"
import { Heading, Icon, Select, Tabs } from "../components/ui"
import { defaults } from "../demo/config"
import { useHash } from "../hooks/useHash"
import Appointments from "./admin/Appointments"
import Overview from "./admin/Overview"
import { useRoster } from "./admin/roster"
import Rules from "./admin/Rules"
import { emptyFilter, StudentDirectory, StudentProfile, type StudentFilter } from "./admin/Students"
import Tracker from "./admin/Tracker"

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Students" },
  { id: "appointments", label: "Appointments" },
  { id: "tracker", label: "Vaccination tracker" },
  { id: "rules", label: "Rules" },
]

export default function Admin() {
  const [hash, setHash] = useHash()
  const [tab, setTab] = useState("overview")
  const [campaign, setCampaign] = useState("fall")
  const [filter, setFilter] = useState<StudentFilter>(emptyFilter)
  const summaries = useRoster()
  const studentId = hash.startsWith("student/") ? hash.slice(8) : ""
  const current = studentId ? "students" : tab
  const go = (id: string) => {
    if (studentId) setHash("")
    setTab(id)
  }
  const openStudents = (patch: Partial<StudentFilter>) => {
    setFilter({ ...emptyFilter, ...patch })
    go("students")
  }
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="eyebrow">ADMINISTRATION</div>
        {tabs.map((t) => (
          <button
            key={t.id}
            className="sidebar-item"
            style={{ border: 0, textAlign: "left", background: current === t.id ? undefined : "transparent" }}
            aria-current={current === t.id ? "page" : undefined}
            onClick={() => go(t.id)}
          >
            <Icon name={t.id === "students" ? "user" : t.id === "appointments" ? "calendar" : "grid"} />
            {t.label}
          </button>
        ))}
        <div className="sidebar-note">
          <Icon name="info" />
          <p>
            End-to-end prototype
            <br />
            <span>Local data, clearly labeled.</span>
          </p>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-title">
          <div className="page-heading">
            <div className="eyebrow">A SHARED VIEW OF PROGRESS</div>
            <Heading>{tabs.find((t) => t.id === current)?.label === "Overview" ? "Campaign overview" : tabs.find((t) => t.id === current)?.label}</Heading>
            <p>A clear view of activity, from first scan to reported dose.</p>
          </div>
          <Select label="Campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)}>
            <option value="fall">{defaults.campaign}</option>
            <option value="spring">Fern Valley · Spring 2027</option>
          </Select>
        </div>
        <Tabs tabs={tabs} active={current} onChange={go} />
        {current === "overview" && <Overview campaign={campaign} summaries={summaries} openStudents={openStudents} />}
        {current === "students" &&
          (studentId ? (
            <StudentProfile summary={summaries.find((s) => s.student.id === studentId)} onBack={() => setHash("")} />
          ) : (
            <StudentDirectory summaries={summaries} filter={filter} setFilter={setFilter} onOpen={(id) => setHash(`student/${id}`)} />
          ))}
        {current === "appointments" && <Appointments campaign={campaign} />}
        {current === "tracker" && <Tracker summaries={summaries} />}
        {current === "rules" && <Rules active={campaign === "fall"} />}
      </main>
    </div>
  )
}

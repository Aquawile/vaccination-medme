import { useState } from "react"
import { Heading, Icon, Select, Tabs } from "../components/ui"
import { defaults } from "../demo/config"
import { useDemo } from "../state"
import { useHash } from "../hooks/useHash"
import Drives from "./admin/Drives"
import Calendar from "./admin/Calendar"
import Outreach from "./admin/Outreach"
import Overview from "./admin/Overview"
import Reports from "./admin/Reports"
import { useRoster } from "./admin/roster"
import SchoolSettings from "./admin/SchoolSettings"
import StudentSearch from "./admin/StudentSearch"
import { emptyFilter, StudentDirectory, StudentProfile, type StudentFilter } from "./admin/Students"

const tabs = [
  { id: "overview", label: "Today" },
  { id: "students", label: "Students" },
  { id: "outreach", label: "Outreach" },
  { id: "clinics", label: "Clinics" },
  { id: "calendar", label: "Calendar" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
]
const icons: Record<string, string> = { overview: "grid", students: "user", outreach: "document", clinics: "user", calendar: "calendar", reports: "calendar", settings: "lock" }

export default function Admin() {
  const [hash, setHash] = useHash()
  const [tab, setTab] = useState("overview")
  const [campaign, setCampaign] = useState("fall")
  const [filter, setFilter] = useState<StudentFilter>(emptyFilter)
  const [selected, setSelected] = useState<string[]>([])
  const [audience, setAudience] = useState("")
  const summaries = useRoster()
  const { data: demo } = useDemo()
  const schoolState = demo.schoolState
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
  const openProfile = (id: string) => {
    setTab("students")
    setHash(`student/${id}`)
  }
  const contact = (a: string) => {
    setAudience(a)
    go("outreach")
  }
  const title = current === "overview" ? "Campaign overview" : tabs.find((t) => t.id === current)?.label
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="eyebrow">ADMINISTRATION</div>
        {tabs.map((t) => (
          <button
            key={t.id}
            className="sidebar-item"
            style={{ border: 0, textAlign: "left" }}
            aria-current={current === t.id ? "page" : undefined}
            onClick={() => go(t.id)}
          >
            <Icon name={icons[t.id]} />
            {t.label}
          </button>
        ))}
      </aside>
      <main className="admin-main">
        <div className="admin-title">
          <div className="page-heading">
            <div className="eyebrow">{defaults.campaign.toUpperCase()}</div>
            <Heading>{title}</Heading>
          </div>
          <StudentSearch summaries={summaries} onOpen={openProfile} />
          <Select label="Campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)}>
            <option value="fall">{defaults.campaign}</option>
            <option value="spring">Fern Valley · Spring 2027</option>
          </Select>
        </div>
        <Tabs tabs={tabs} active={current} onChange={go} />
        {current === "overview" && <Overview summaries={summaries} openStudents={openStudents} openOutreach={contact} openProfile={openProfile} />}
        {current === "students" &&
          (studentId ? (
            <StudentProfile summary={summaries.find((s) => s.student.id === studentId)} onBack={() => setHash("")} />
          ) : (
            <StudentDirectory
              summaries={summaries}
              filter={filter}
              setFilter={setFilter}
              onOpen={openProfile}
              selected={selected}
              setSelected={setSelected}
              onContact={() => contact("selected")}
            />
          ))}
        {current === "outreach" && <Outreach summaries={summaries} initialAudience={audience} selected={selected} />}
        {current === "clinics" && <Drives summaries={summaries} onNotify={() => contact("needs-visit")} />}
        {current === "calendar" && <Calendar summaries={summaries} state={schoolState} onOpen={openProfile} />}
        {current === "reports" && <Reports summaries={summaries} state={schoolState} onOpen={openProfile} />}
        {current === "settings" && <SchoolSettings />}
      </main>
    </div>
  )
}

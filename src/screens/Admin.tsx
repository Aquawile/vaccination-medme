import { useMemo, useState } from "react"
import { Heading, Icon, Select, Tabs } from "../components/ui"
import { stateName } from "../data/states"
import { defaults } from "../demo/config"
import { useHash } from "../hooks/useHash"
import Drives from "./admin/Drives"
import Outreach from "./admin/Outreach"
import Overview from "./admin/Overview"
import Reports from "./admin/Reports"
import { useRoster } from "./admin/roster"
import Rules from "./admin/Rules"
import StudentSearch from "./admin/StudentSearch"
import { emptyFilter, StudentDirectory, StudentProfile, type StudentFilter } from "./admin/Students"

const tabs = [
  { id: "overview", label: "Today" },
  { id: "students", label: "Students" },
  { id: "outreach", label: "Outreach" },
  { id: "drives", label: "Drives" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
]
const icons: Record<string, string> = { overview: "grid", students: "user", outreach: "document", drives: "calendar", reports: "calendar", settings: "lock" }

export default function Admin() {
  const [hash, setHash] = useHash()
  const [tab, setTab] = useState("overview")
  const [campaign, setCampaign] = useState("fall")
  const [filter, setFilter] = useState<StudentFilter>(emptyFilter)
  const [selected, setSelected] = useState<string[]>([])
  const [audience, setAudience] = useState("")
  const everyone = useRoster()
  const [stateFilter, setStateFilter] = useState("all")
  const summaries = useMemo(() => (stateFilter === "all" ? everyone : everyone.filter((s) => s.student.state === stateFilter)), [everyone, stateFilter])
  const stateCodes = [...new Set(everyone.map((s) => s.student.state))].sort()
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
            style={{ border: 0, textAlign: "left", background: current === t.id ? undefined : "transparent" }}
            aria-current={current === t.id ? "page" : undefined}
            onClick={() => go(t.id)}
          >
            <Icon name={icons[t.id]} />
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
            <div className="eyebrow">{defaults.campaign.toUpperCase()}</div>
            <Heading>{title}</Heading>
          </div>
          <StudentSearch summaries={summaries} onOpen={openProfile} />
          <Select label="State" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="all">All states</option>
            {stateCodes.map((c) => <option key={c} value={c}>{stateName(c)}</option>)}
          </Select>
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
        {current === "drives" && <Drives summaries={summaries} onNotify={() => contact("needs-visit")} />}
        {current === "reports" && <Reports campaign={campaign} summaries={summaries} everyone={everyone} />}
        {current === "settings" && <Rules active={campaign === "fall"} />}
      </main>
    </div>
  )
}

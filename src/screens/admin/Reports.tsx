import { useState } from "react"
import { Button, Card, Heading, Tabs } from "../../components/ui"
import { complianceReportPdf } from "../../demo/adminDocs"
import { downloadBlob } from "../../demo/documents"
import type { StudentSummary } from "../../domain/cohorts"
import CategoryView from "./CategoryView"
import Tracker from "./Tracker"

const views = [
  { id: "category", label: "By category" },
  { id: "vaccine", label: "By vaccine" },
  { id: "documents", label: "Documents" },
]

export default function Reports({ summaries, state, onOpen }: { summaries: StudentSummary[]; state: string; onOpen: (id: string) => void }) {
  const [view, setView] = useState("category")
  return (
    <>
      <Tabs tabs={views} active={view} onChange={setView} />
      <div style={{ marginTop: "var(--space-5)" }}>
        {view === "category" && <CategoryView summaries={summaries} state={state} onOpen={onOpen} />}
        {view === "vaccine" && <Tracker summaries={summaries} />}
        {view === "documents" && (
          <Card>
            <Heading level={2}>Documents</Heading>
            <p className="muted">A summary of this school's students for your records. It is a demo summary, not a state form. State certificates are signed by the people each state names; see Settings for the state's own pages.</p>
            <div className="action-row">
              <Button variant="secondary" onClick={() => downloadBlob(complianceReportPdf(summaries, "All students"), "compliance-summary-demo.pdf")}>School summary (PDF)</Button>
            </div>
            <p className="inline-note">Lists and counts are downloaded from the By category view. A student's own record is downloaded from their profile.</p>
          </Card>
        )}
      </div>
    </>
  )
}

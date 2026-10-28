import { useState } from "react"
import { Badge, Card, Heading, Icon, Select } from "../../components/ui"
import { vaccines } from "../../demo/config"
import { dateLabel } from "../../demo/journey"
import { useDemo } from "../../state"

// Fictional historical entries in the sample school extract, not verified clinical records.
const schoolExtract = [
  {id:"SAMPLE-HIST-01",vaccine:"dtap",date:"2021-05-18",lot:"SAMPLE-A11",signature:"School-import example",source:"Fictional school extract"},
  {id:"SAMPLE-HIST-02",vaccine:"polio",date:"2022-06-02",lot:"SAMPLE-B12",signature:"School-import example",source:"Fictional school extract"},
  {id:"SAMPLE-HIST-03",vaccine:"dtap",date:"2023-08-14",lot:"SAMPLE-C13",signature:"School-import example",source:"Fictional school extract"},
]

/** Fictional school import alongside actual doses recorded in this browser's pharmacist workspace. */
export default function Records() {
  const { data } = useDemo()
  const [filter, setFilter] = useState("all")
  const pharmacyRows = data.appointments.flatMap((a) => a.doses.map((d) => ({
    id:d.id,vaccine:d.vaccine,date:d.date,lot:d.lot,signature:d.signature,
    source:a.recordSource || "Demo pharmacist appointment",reported:d.reported,kind:"pharmacy" as const,
  })))
  const rows = [
    ...schoolExtract.map((d)=>({...d,reported:false,kind:"school" as const})),
    ...pharmacyRows,
  ].filter((r)=>filter==="all"||r.vaccine===filter).sort((a,b)=>b.date.localeCompare(a.date))
  return (
    <main className="parent-main parent-records-screen">
      <div className="page-heading"><div className="eyebrow">YOUR CHILD'S HISTORY</div><Heading>Vaccination records</Heading>
        <p>See the fictional school-import history and any doses recorded by the pharmacist in this demo.</p>
      </div>
      <Card className="history-card">
        <div className="section-heading"><div><Heading level={2}>Dose history</Heading><p className="muted">These entries are examples, not verified medical records.</p></div><Badge>{rows.length} shown</Badge></div>
        <Select label="Filter by vaccine" value={filter} onChange={(e)=>setFilter(e.target.value)}>
          <option value="all">All vaccines</option>
          {vaccines.map((v)=><option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>
        <div className="parent-record-explanation">
          <strong>Where do records come from?</strong>
          <p>The school history below is fictional, imported sample information. When a pharmacist records an administered dose for an appointment in this app, it is added to this same history using shared demo data.</p>
          <p>Saving a dose does not verify a child's full immunization history or prove that state requirements are met.</p>
        </div>
        {rows.length===0?<p className="empty-inline">No matching records.</p>:<div className="history-list">
          {rows.map((r)=><div className="history-row" key={r.id}>
            <span className="history-check"><Icon name="check" size={15}/></span>
            <div className="parent-record-info">
              <strong>{vaccines.find((v)=>v.id===r.vaccine)?.name??r.vaccine} · {dateLabel(r.date)}</strong>
              <small>Source: {r.kind==="school"?"Fictional school extract":"Pharmacist-recorded demo appointment"}</small>
              <small>Sample lot: {r.lot} · {r.signature}</small>
            </div>
            <Badge kind={r.reported?"success":""}>{r.kind==="school"?"Imported example":r.reported?"Reported (demo)":"Saved locally"}</Badge>
          </div>)}
        </div>}
      </Card>
    </main>
  )
}

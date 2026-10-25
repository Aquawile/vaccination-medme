import { vaccineName } from "../data/vaccines"
import { stateName } from "../data/states"
import type { StudentSummary } from "../domain/cohorts"
import { dateLabel } from "./journey"
import { defaults } from "./config"
import { Pdf } from "./pdf"

const DEMO = "DEMO DOCUMENT - FICTIONAL DATA - NOT A LEGAL RECORD"
const statusText: Record<string, string> = {
  complete: "Complete",
  missing: "Missing dose(s)",
  "not-yet-due": "Not yet due",
  unknown: "Unknown",
  "up-to-date": "Up to date",
}

function footer(pdf: Pdf, id: string, page: number, total: number) {
  pdf.line(48, 752, 564, 752, 0.6, 0.6)
  pdf.text(48, 768, 8, `${id}  |  Prepared ${dateLabel(defaults.referenceDate)}  |  Demo data, stored on this device`, false, 0.4)
  pdf.text(500, 768, 8, `Page ${page} of ${total}`, false, 0.4)
}
function header(pdf: Pdf, title: string, id: string) {
  pdf.text(48, 56, 9, defaults.school.toUpperCase(), true, 0.35)
  pdf.text(48, 82, 18, title, true)
  pdf.text(48, 98, 9, defaults.campaign, false, 0.4)
  pdf.text(420, 56, 8, `Record ID ${id}`, false, 0.4)
  pdf.rect(48, 108, 516, 20, { fill: 0.92, stroke: 0.6 })
  pdf.text(60, 122, 8.5, DEMO, true, 0.25)
}
function section(pdf: Pdf, y: number, label: string) {
  pdf.text(48, y, 10, label, true)
  pdf.line(48, y + 5, 564, y + 5, 0.8, 0.2)
  return y + 18
}

/** One-page student immunization record laid out like a school record, with blank signature lines. */
export function studentRecordPdf(s: StudentSummary) {
  const { student: st } = s
  const id = `REC-${st.id.toUpperCase()}`
  const pdf = new Pdf()
  header(pdf, "Student Immunization Record", id)
  let y = section(pdf, 156, "1. Student information")
  const cell = (x: number, yy: number, w: number, label: string, value: string) => {
    pdf.rect(x, yy, w, 34, { stroke: 0.6 })
    pdf.text(x + 6, yy + 11, 7, label.toUpperCase(), false, 0.45)
    pdf.text(x + 6, yy + 26, 10, value)
  }
  cell(48, y, 258, "Student name", st.name)
  cell(306, y, 129, "Student ID", st.id)
  cell(435, y, 129, "Date of birth", dateLabel(st.birthDate))
  cell(48, y + 34, 258, "School", st.school)
  cell(306, y + 34, 129, "Grade", st.grade)
  cell(435, y + 34, 129, "State", stateName(st.state))
  y = section(pdf, y + 76, "2. Required vaccines")
  const cols = [48, 150, 235, 320, 450]
  pdf.rect(48, y - 4, 516, 18, { fill: 0.9 })
  ;["Vaccine", "Doses required", "Doses on record", "Status", "Requirement status"].forEach((h, i) => pdf.text(cols[i] + 4, y + 9, 8, h, true))
  y += 18
  if (s.results.length === 0) {
    pdf.text(52, y + 12, 9, `No requirements on file for ${stateName(st.state)}. Check with the state health department.`)
    y += 26
  }
  for (const r of s.results) {
    pdf.line(48, y + 18, 564, y + 18, 0.4, 0.75)
    pdf.text(cols[0] + 4, y + 12, 9, vaccineName(r.vaccineId), true)
    pdf.text(cols[1] + 4, y + 12, 9, String(r.dosesRequired))
    pdf.text(cols[2] + 4, y + 12, 9, String(r.dosesRecorded))
    pdf.text(cols[3] + 4, y + 12, 9, statusText[r.status])
    pdf.text(cols[4] + 4, y + 12, 9, r.verification === "read-on-official-page" ? "Source on file" : "Not verified")
    y += 18
  }
  y = section(pdf, y + 22, "3. Dose history")
  if (st.hasRecord === false) pdf.text(52, y + 10, 9, "No record found. Status is unknown, not missing.")
  const history = [...st.doses].sort((a, b) => a.date.localeCompare(b.date))
  if (st.hasRecord !== false && history.length === 0) pdf.text(52, y + 10, 9, "A record exists and lists no doses.")
  history.slice(0, 14).forEach((d, i) => {
    pdf.text(52, y + 10 + i * 14, 9, `${dateLabel(d.date)}    ${vaccineName(d.vaccineId)}    Source: ${d.source}`)
  })
  y += Math.max(1, Math.min(history.length, 14)) * 14 + 20
  y = section(pdf, y, "4. Notes")
  y = pdf.paragraph(
    52, y + 10, 8.5,
    "Status is shown against the requirement list on file for this state and grade. This record reports what is documented; it does not recommend any vaccine or age. Requirement lists in this demo are unverified samples.",
    100, 0.25,
  )
  y = section(pdf, Math.max(y + 18, 600), "5. Certification (left blank in this demo)")
  pdf.line(52, y + 26, 300, y + 26, 0.6, 0.2)
  pdf.line(330, y + 26, 560, y + 26, 0.6, 0.2)
  pdf.text(52, y + 38, 7.5, "School official, printed name and title", false, 0.45)
  pdf.text(330, y + 38, 7.5, "Signature and date", false, 0.45)
  footer(pdf, id, 1, 1)
  return pdf.blob()
}

/** Multi-page compliance report for any list of students. */
export function complianceReportPdf(rows: StudentSummary[], scope: string) {
  const id = "RPT-DEMO-001"
  const pdf = new Pdf()
  header(pdf, "Immunization Compliance Report", id)
  let y = section(pdf, 156, "1. Scope and summary")
  pdf.text(52, y + 10, 9, `Scope: ${scope}`)
  const n = (k: string) => rows.filter((r) => r.status === k).length
  const items: [string, number][] = [["Students in scope", rows.length], ["Up to date", n("up-to-date")], ["Missing at least one dose", n("missing")], ["Unknown (no record or no rules on file)", n("unknown")]]
  items.forEach(([label, v], i) => {
    pdf.text(52, y + 30 + i * 15, 9, label)
    pdf.text(300, y + 30 + i * 15, 9, `${v}${rows.length ? `  (${Math.round((v / rows.length) * 100)}%)` : ""}`, true)
  })
  const list = rows.filter((r) => r.status !== "up-to-date")
  const perPage = 36
  const chunks: StudentSummary[][] = []
  for (let i = 0; i < list.length; i += perPage) chunks.push(list.slice(i, i + perPage))
  const cols = [48, 200, 262, 310, 440]
  const tableHead = (yy: number) => {
    pdf.rect(48, yy - 4, 516, 18, { fill: 0.9 })
    ;["Student", "ID", "Grade", "School", "Missing / status"].forEach((h, i) => pdf.text(cols[i] + 4, yy + 9, 8, h, true))
  }
  const draw = (chunk: StudentSummary[], top: number) => {
    let yy = top + 18
    for (const r of chunk) {
      pdf.line(48, yy + 14, 564, yy + 14, 0.3, 0.8)
      pdf.text(cols[0] + 4, yy + 9, 8.5, r.student.name)
      pdf.text(cols[1] + 4, yy + 9, 8.5, r.student.id)
      pdf.text(cols[2] + 4, yy + 9, 8.5, r.student.grade)
      pdf.text(cols[3] + 4, yy + 9, 8.5, r.student.school.replace(" Elementary", ""))
      pdf.text(cols[4] + 4, yy + 9, 8.5, r.missing.length ? r.missing.map(vaccineName).join(", ") : statusText[r.status])
      yy += 14
    }
  }
  y = section(pdf, y + 100, "2. Students not yet in compliance")
  if (chunks.length === 0) pdf.text(52, y + 10, 9, "Every student in scope is up to date.")
  chunks.forEach((chunk, i) => {
    if (i > 0) {
      pdf.newPage()
      header(pdf, "Immunization Compliance Report", id)
      tableHead(160)
      draw(chunk, 160)
    } else {
      tableHead(y)
      draw(chunk.slice(0, Math.floor((650 - y) / 14)), y)
      const rest = chunk.slice(Math.floor((650 - y) / 14))
      if (rest.length) {
        pdf.newPage()
        header(pdf, "Immunization Compliance Report", id)
        tableHead(160)
        draw(rest, 160)
      }
    }
  })
  const count = pdf.pages.length
  for (let i = 0; i < count; i++) {
    pdf.go(i)
    footer(pdf, id, i + 1, count)
  }
  return pdf.blob()
}

export function studentsCsv(rows: StudentSummary[]) {
  const cell = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`
  const head = ["DEMO DATA - FICTIONAL STUDENTS"]
  const cols = ["Student ID", "Name", "School", "Grade", "State", "Status", "Missing vaccines", "Visit booked"]
  const body = rows.map((r) => [r.student.id, r.student.name, r.student.school, r.student.grade, r.student.state, statusText[r.status], r.missing.map(vaccineName).join("; "), r.student.visitDate ?? ""])
  return new Blob([[head, cols, ...body].map((row) => row.map(cell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" })
}

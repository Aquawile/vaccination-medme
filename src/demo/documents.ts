import { vaccines } from "./config"
import { dateLabel, locations, type Appointment } from "./journey"
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function proofLines(a: Appointment) {
  return [
    "DEMO DATA - NOT VALID MEDICAL PROOF",
    "Vaccination entry summary",
    `Appointment: ${a.id}`,
    `Child: ${a.child.name} | Birth date: ${a.child.birthDate}`,
    `School: ${a.child.school}`,
    `Location: ${locations.find((p) => p.id === a.locationId)?.name}`,
    `Visit date: ${dateLabel(a.date)}`,
    ...a.doses.flatMap((d) => [
      `${vaccines.find((v) => v.id === d.vaccine)?.name} | ${dateLabel(d.date)} at ${d.time}`,
      `Lot: ${d.lot} | Site: ${d.site}`,
      `Recorded and demo-signed by: ${d.signature}`,
    ]),
    `Saved doses: ${a.doses.length} of ${a.vaccines.length} selected`,
    "Only saved administered doses appear in this document.",
    "This summary does not establish school acceptance or registry reporting.",
    "Fictional data. No real clinical service or verification.",
  ]
}
// DEMO-FAKE: a real downloadable PDF containing only locally saved demo doses.
export function createProofPdf(a: Appointment) {
  const text = proofLines(a)
    .flatMap((line) => {
      const ascii = line.replace(/[^\x20-\x7e]/g, "-")
      return ascii.match(/.{1,82}(?:\s|$)|.{1,82}/g) || [""]
    })
    .map((line) => line.trim().replace(/[\\()]/g, "\\$&"))
  const stream = `BT /F1 11 Tf 48 780 Td 19 TL ${text.map((line, i) => `${i ? "T* " : ""}(${line}) Tj`).join("\n")} ET`
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((obj, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: "application/pdf" })
}
export function exportDoses(a: Appointment) {
  // Prefix potentially formula-like values to keep demo CSV safe in spreadsheets.
  const cell = (value: string) =>
    `"${(/^[=+\-@\t\r]/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`
  const rows = [
    ["DEMO DATA - NOT SUBMITTED TO A REGISTRY"],
    [
      "Appointment",
      "Child",
      "Birth date",
      "Vaccine",
      "Date",
      "Time",
      "Lot",
      "Site",
      "Clinician",
    ],
    ...a.doses.map((d) => [
      a.id,
      a.child.name,
      a.child.birthDate,
      d.vaccine,
      d.date,
      d.time,
      d.lot,
      d.site,
      d.signature,
    ]),
  ]
  downloadBlob(
    new Blob([rows.map((row) => row.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
    `${a.id}-demo-registry-export.csv`,
  )
}

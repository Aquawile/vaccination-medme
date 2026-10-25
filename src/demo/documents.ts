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
    "DEMO DATA · NOT VALID MEDICAL PROOF",
    "Vaccination record summary",
    `Appointment: ${a.id}`,
    `Child: ${a.child.name} | Birth date: ${a.child.birthDate}`,
    `School: ${a.child.school}`,
    `Location: ${locations.find((p) => p.id === a.locationId)?.name}`,
    `Visit date: ${dateLabel(a.date)}`,
    "",
    "SAVED ADMINISTERED DOSES",
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
  const stream = [
    "q 0.137 0.365 0.278 rg 0 760 612 82 re f Q",
    "q 0.988 0.537 0.706 rg 48 790 12 12 re f Q",
    "BT /F2 20 Tf 72 792 Td (Vaccination record summary) Tj ET",
    "BT /F1 9 Tf 72 776 Td (LOCAL DEMO  /  SAVED ADMINISTERED DOSES) Tj ET",
    "0.86 0.87 0.9 RG 48 744 m 564 744 l S",
    `BT /F1 10 Tf 48 720 Td 17 TL ${text.map((line, i) => `${i ? "T* " : ""}(${line}) Tj`).join("\n")} ET`,
    "0.42 0.44 0.5 rg",
    "BT /F1 8 Tf 48 38 Td (Fictional records - Stored on this device - No live clinical services) Tj ET",
  ].join("\n")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R /F2 6 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((obj, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 7\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, "0")} 00000 n \n`)
    .join("")}trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
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

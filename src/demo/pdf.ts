// DEMO-FAKE: a tiny dependency-free PDF writer (Helvetica only, ASCII text, multiple pages).
// Coordinates are measured from the top-left of a US Letter page, in points.
const W = 612
const H = 792
const clean = (t: string) => t.replace(/[^\x20-\x7e]/g, "-").replace(/[\\()]/g, "\\$&")

export class Pdf {
  pages: string[][] = [[]]
  private cur = 0
  private get ops() {
    return this.pages[this.cur]
  }
  newPage() {
    this.pages.push([])
    this.cur = this.pages.length - 1
  }
  /** Draw on an earlier page, for example to add footers once the page count is known. */
  go(index: number) {
    this.cur = index
  }
  text(x: number, y: number, size: number, str: string, bold = false, gray = 0) {
    this.ops.push(`${gray} g BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${H - y} Td (${clean(str)}) Tj ET`)
  }
  line(x1: number, y1: number, x2: number, y2: number, width = 0.6, gray = 0.5) {
    this.ops.push(`${gray} G ${width} w ${x1} ${H - y1} m ${x2} ${H - y2} l S`)
  }
  rect(x: number, y: number, w: number, h: number, opts: { fill?: number; stroke?: number } = {}) {
    if (opts.fill !== undefined) this.ops.push(`${opts.fill} g ${x} ${H - y - h} ${w} ${h} re f`)
    if (opts.stroke !== undefined) this.ops.push(`${opts.stroke} G 0.6 w ${x} ${H - y - h} ${w} ${h} re S`)
  }
  /** Wrap text to a width in characters and return the y after the last line. */
  paragraph(x: number, y: number, size: number, str: string, chars: number, gray = 0, lead = size + 4) {
    const words = str.split(/\s+/)
    let current = ""
    const out: string[] = []
    for (const w of words) {
      if ((current + " " + w).trim().length > chars) {
        out.push(current)
        current = w
      } else current = (current + " " + w).trim()
    }
    if (current) out.push(current)
    out.forEach((l, i) => this.text(x, y + i * lead, size, l, false, gray))
    return y + out.length * lead
  }
  blob() {
    const total = this.pages.length
    const objects: string[] = []
    // 1 catalog, 2 pages, 3 F1, 4 F2, then per page: page object and content stream
    const kids = this.pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ")
    objects.push("<< /Type /Catalog /Pages 2 0 R >>")
    objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${total} >>`)
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    this.pages.forEach((ops, i) => {
      const stream = ops.join("\n")
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`,
      )
      objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
    })
    let pdf = "%PDF-1.4\n"
    const offsets: number[] = []
    objects.forEach((obj, i) => {
      offsets.push(pdf.length)
      pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`
    })
    const xref = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((n) => `${String(n).padStart(10, "0")} 00000 n \n`).join("")}`
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
    return new Blob([pdf], { type: "application/pdf" })
  }
}
export const PAGE = { W, H }

/** DEMO-FAKE: which families have opted out of texts and email. A real build reads each family's saved preference. */
export function optedOut(studentId: string): boolean {
  const n = Number(studentId.replace(/\D/g, ""))
  return Number.isFinite(n) && n > 0 && n % 11 === 0
}

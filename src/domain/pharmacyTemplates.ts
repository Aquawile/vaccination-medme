// Scheduling messages only. They never carry medical advice.
export type Template = { label: string; subject: string; body: string }
export const builtInTemplates: Record<string, Template> = {
  reminder: { label: "Visit reminder", subject: "Reminder: {student}'s visit on {date} at {time}", body: "Hello {parent},\n\nThis is a reminder that {student} has a vaccination visit at {pharmacy} on {date} at {time} for {vaccines}.\n\nIf you need to change the time, you can do it in the app.\n\nThank you,\n{pharmacy}" },
  noshow: { label: "Missed visit, cancelled", subject: "We missed {student} on {date}", body: "Hello {parent},\n\n{student} did not arrive for the visit on {date} at {time}, so we have cancelled it to free the time for others. You can book a new time in the app whenever you like.\n\nThank you,\n{pharmacy}" },
  short: { label: "Short on a vaccine", subject: "A change to {student}'s visit on {date}", body: "Hello {parent},\n\nWe are short on: {short}. Your visit on {date} at {time} may need a new time. We will confirm, or you can pick another time in the app.\n\nThank you,\n{pharmacy}" },
  followup: { label: "Next dose due", subject: "{student}'s next dose", body: "Hello {parent},\n\n{student} has a follow-up visit at {pharmacy} on {date} at {time} for {vaccines}. Reply to this message or use the app if you need a different time.\n\nThank you,\n{pharmacy}" },
  custom: { label: "Custom message", subject: "", body: "" },
}
export const mergeFields = ["{parent}", "{student}", "{date}", "{time}", "{vaccines}", "{short}", "{pharmacy}"]

/** Send date for a reminder N days before a visit. */
export function reminderDate(visitDate: string, daysBefore: number): string {
  const d = new Date(`${visitDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - daysBefore)
  return d.toISOString().slice(0, 10)
}

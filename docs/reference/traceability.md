# Traceability: use cases to the app

Build status of every use case in the UC Master Table v2 PDF. Work items refer to `docs/prd.md` section 5. "Verify" means the screen exists but a test does not yet prove the use case end to end; it is checked in the first PR that touches it.

| Use case | Status | Work item | Where |
| --- | --- | --- | --- |
| UC-Profile-01 Create Parent Account | Built (demo): email, password, then a 6-digit code (shown on screen, a real build emails it) | W-127 | Auth.tsx |
| UC-Profile-02 Add Child Profile | Built, verify | W-02 | Parent.tsx |
| UC-Profile-03 Record Parent Consent | Built (demo): relationship, name, date stored and shown to the pharmacist; the state's own page is linked, no consent rule written by MedMe | W-127 | Booking.tsx, OfficialSource.tsx |
| UC-Entry-01 Open from QR or Link | Built (demo): `#from/<source>/<school-id>` shows the school | W-110, W-127 | App.tsx |
| UC-Entry-02 Sign In | Built (demo): passwordless code option | W-127 | Auth.tsx |
| UC-Entry-03 Manage Session | Gap (30 min idle timeout) | none | services.ts |
| UC-Record-01 Pull Registry Record | Simulated | W-71 | services.ts |
| UC-Record-02 Enter Record Manually | Built: school's listed dose shown beside the vaccine; state page linked | W-127 | RecordPanel.tsx |
| UC-Record-03 Upload Record Photo | Gap | none | |
| UC-Check-01 Run Missing-Shot Check | Built: school-list summary on home, requirements and booking; never recommends | W-127 | RequirementSummary.tsx |
| UC-Check-02 Show Earliest Dates | Built in domain | W-05 | domain/missingShots.ts |
| UC-Check-03 Select Vaccines to Book | Built: nothing preselected (tested) | W-127 | Parent.tsx |
| UC-Match-01 Publish Accepted Vaccines | Gap (no owner settings screen) | W-70 | |
| UC-Match-02 Search Eligible Pharmacies | Built, verify | W-06 | Booking.tsx |
| UC-Match-03 Show Fallback Options | Built: other routes (school clinic, own doctor, health department) and the state's page | W-127 | Booking.tsx |
| UC-Book-01 Check Insurance and Cost | Built, fake prices | none | Booking.tsx |
| UC-Book-02 Choose Slot | Built | W-07 | Booking.tsx |
| UC-Book-03 Send Reminders | Simulated | W-41 | ParentAppointments.tsx |
| UC-Book-04 Reschedule or Cancel | Built: change date or time frees the old time; cancel kept | W-127 | ParentAppointments.tsx |
| UC-Visit-01 View Pre-filled Appointment | Built | W-13 | Pharmacist.tsx |
| UC-Visit-02 Verify Consent and Eligibility | Built: consent record and state page shown on the review checklist | W-127 | Pharmacist.tsx |
| UC-Visit-03 Decline or Refer | Built, verify | W-40 | Pharmacist.tsx |
| UC-Visit-04 Record Dose | Built | W-40 | Pharmacist.tsx |
| UC-Proof-01 Report to Registry | Simulated | W-71 | services.ts |
| UC-Proof-02 Generate Proof | Built (PDF redesign parked) | W-53, W-98 | Parent.tsx |
| UC-Proof-03 Share Proof with School | Built (demo): share link, PDF, who signed, and what the school accepts is linked to the state | W-127 | Proof.tsx |
| UC-Proof-04 Send Next-Dose Reminder | Gap | none | |
| UC-School-01 Create School Drive | Built (simulated pharmacy answer); shown as Clinics tab and on the Calendar | W-70 | admin/Drives.tsx |
| UC-School-02 Accept Drive | Built (simulated, sample hours and capacity) | W-70 | domain/drives.ts |
| UC-School-03 Notify Families | Built (template, a person approves, notice tracking) | W-42, W-102 | admin/Outreach.tsx |
| UC-School-04 View Drive Completion | Built (counts only, groups under 10 hidden) | W-70 | admin/Drives.tsx |
| UC-Admin-01 View Campaign Funnel | Built (Today: missing, contacted, booked; Reports: by category and vaccine) | W-23 | admin/Overview.tsx |
| UC-Admin-02 Maintain State Rules | Changed by decision: no rules written by MedMe; Settings links to official government pages | W-26 | admin/SchoolSettings.tsx |

## Use cases with no work item yet

UC-Entry-01, UC-Entry-03, UC-Record-03, UC-Proof-04. Proposed new items: W-110 school landing route from QR or link, W-111 session idle timeout, W-112 record photo upload (stored in the browser only, DEMO-FAKE), W-113 next-dose reminder from the interval table.

## Work items with no use case

W-97 to W-109 (categories, key dates, report worksheet, notices) serve the administrator view in `updates-since-v2.md` U-01 to U-06 and U-10. They have no UC in the v2 table. Proposed: add UC-Admin-03 View School Categories and UC-Admin-04 Prepare Government Report Worksheet to the next version of the master table.

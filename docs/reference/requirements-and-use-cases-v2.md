# MedMe School Vaccines: Requirements and Use Cases (v2)

Source: Claude Doc "MedMe School Vaccines Requirements and Use Cases v2", dated 2026-10-20. Copied into the repo as a governing reference. Amendments made after this date are in `updates-since-v2.md`. Items marked (A) depend on answers from Nick or from pharmacists.

## Core features

1. Create and manage parent and child profiles, including parent consent for a minor
2. Let parents open the app from a school slip QR code, a school email or a pharmacy ad, and sign in securely
3. Pull a child's vaccine record from the state registry, or let the parent enter or upload it
   - a. Registry access depends on what MedMe or the pharmacy can query (A)
   - b. Photos and typed records are reviewed by the pharmacist, not trusted automatically
4. Compare the record to the school's requirement for the child's state and grade, and list missing doses with the earliest allowed date
5. Let pharmacies publish which vaccines and ages they give, plus capacity, and let parents see matching nearby pharmacies
6. Show the cost ($0 or a price) before booking, let parents pick a slot, and send reminders
7. Give pharmacists a pre-filled appointment view and record the dose once
8. Report doses to the state registry and produce a pharmacist-signed proof the parent can send to the school
   - a. Think registry reporting, with a manual export as the fallback (A)
9. Let schools create a drive with a QR code and slots, notify families, and see aggregate completion
10. Give MedMe staff a campaign view of scans, bookings, completed and reported shots, and let admins maintain the state rules table

## Core requirements

| ID | Description | User action / trigger | Acceptance criteria (Given, when, then) | Non-functional requirements |
| --- | --- | --- | --- | --- |
| REQ-001 | Profile and consent creation | Parent submits child details and consent. | Given a parent on the app, when they submit a child's name, birth date, grade and school and give consent, then the system must create a profile linked to that parent. | Collect the minimum data. Encrypt at rest. Follow health privacy law (confirm with MedMe). |
| REQ-002 | Entry and authentication | Parent scans a QR code or opens a link. | Given a scanned school QR code, when the page loads, then the system must show the school and state and let the parent continue or sign in. | Page loads within 3 seconds on a phone. Session times out after 30 minutes idle. |
| REQ-003 | Records retrieval | Parent asks for the child's record. | Given a child profile, when the parent asks for the record, then the system must pull it from the registry or offer manual entry (A). | Show the source and date of the record. Handle registry downtime without blocking the parent. |
| REQ-004 | Missing-shot check | Check runs once a record is loaded. | Given a record and the state rule for the grade, when the check runs, then the system must list missing doses and earliest allowed dates. | Show the rule version and source. Return results within 5 seconds. |
| REQ-005 | Pharmacy matching | Parent selects vaccines and searches. | Given selected vaccines and a location, when the parent searches, then only pharmacies that accept those vaccines and that age must appear. | Pharmacy setting changes appear within 1 minute. |
| REQ-006 | Cost check and booking | Parent picks a pharmacy and a slot. | Given an eligible pharmacy and insurance details, when the parent continues, then the system must show $0 or a price before confirming, and schedule a reminder (A). | Never confirm a booking without showing the cost. Reminders by text or email. |
| REQ-007 | Visit documentation | Pharmacist opens the appointment. | Given a booked appointment, when the pharmacist records the dose, then vaccine, lot, site and time must be stored once. | No re-entry. Works on a counter tablet. |
| REQ-008 | Registry report and proof | Pharmacist signs the record. | Given a recorded dose, when the pharmacist signs, then the system must report it to the registry or flag it for manual entry, and produce a proof (A). | Show report status. Proof available as a PDF and a link. |
| REQ-009 | School drives and notices | Nurse creates a drive. | Given a school and a partner pharmacy, when the nurse creates a drive, then the system must produce a QR code and a slot list. | Show aggregate counts only. No child names unless the parent shares proof. |
| REQ-010 | Analytics and rules administration | Staff opens the campaign view or edits a rule. | Given a campaign, when staff open it, then they must see scans, profiles, bookings, completed and reported counts. Given a rule change, when the admin saves, then it must apply without a code change. | Audit log of rule changes. CSV export of funnel data. |

## Core use cases by category (v1 numbering, superseded by the v2 table below)

The v1 table numbered use cases UC-001 to UC-033 across five categories. It is replaced by the v2 table and the IDs in `uc-master-table-v2.md` (for example UC-Profile-01). The old numbers map as follows: UC-001..003 to UC-Profile-01..03; UC-004..006 to UC-Entry-01..03; UC-007..009 to UC-Record-01..03; UC-010..012 to UC-Check-01..03; UC-013..015 to UC-Match-01..03; UC-016..019 to UC-Book-01..04; UC-020..023 to UC-Visit-01..04; UC-024..027 to UC-Proof-01..04; UC-028..031 to UC-School-01..04; UC-032..033 to UC-Admin-01..02.

## Core use cases by category (v2)

| Requirement | Use case ID and title | Purpose | Requirements |
| --- | --- | --- | --- |
| REQ-001 Profile and Consent | UC-Profile-01 Create Parent Account | Parent creates an account. | Requires code verification. |
| | UC-Profile-02 Add Child Profile | Parent enters child details. | Collects only what the check needs. |
| | UC-Profile-03 Record Parent Consent | Parent consents to the vaccination. | Must meet the state consent rule (A). |
| REQ-002 Entry and Authentication | UC-Entry-01 Open from QR or Link | Parent lands on the right school and state. | Link carries the school ID. |
| | UC-Entry-02 Sign In | Returning parent signs in. | Passwordless code. |
| | UC-Entry-03 Manage Session | Parent edits details; session ends when idle. | 30-minute idle timeout. Edits re-run the check. |
| REQ-003 Records Retrieval | UC-Record-01 Pull Registry Record | System fetches the child's record. | Depends on registry access (A). |
| | UC-Record-02 Enter Record Manually | Parent types doses. | Show the requirement beside each field. |
| | UC-Record-03 Upload Record Photo | Parent uploads a paper record. | Pharmacist reviews the image. |
| REQ-004 Missing-Shot Check | UC-Check-01 Run Missing-Shot Check | System lists missing doses. | Uses the state rules table. |
| | UC-Check-02 Show Earliest Dates | System shows first allowed dates. | Uses the interval table. |
| | UC-Check-03 Select Vaccines to Book | Parent chooses vaccines. | Nothing preselected. |
| REQ-005 Pharmacy Matching | UC-Match-01 Publish Accepted Vaccines | Owner lists accepted vaccines and ages. | Warns on state limits. |
| | UC-Match-02 Search Eligible Pharmacies | Parent finds matching pharmacies. | Filters by vaccine, age and location. |
| | UC-Match-03 Show Fallback Options | Parent gets other routes. | Directory by state. |
| REQ-006 Cost Check and Booking | UC-Book-01 Check Insurance and Cost | Parent sees $0 or a price. | Cost shown before confirming (A). |
| | UC-Book-02 Choose Slot | Parent books a time. | Follows pharmacy capacity. |
| | UC-Book-03 Send Reminders | Parent is reminded. | Text or email. |
| | UC-Book-04 Reschedule or Cancel | Parent changes the booking. | Frees the slot. |
| REQ-007 Visit Documentation | UC-Visit-01 View Pre-filled Appointment | Pharmacist sees intake. | No repeated questions. |
| | UC-Visit-02 Verify Consent and Eligibility | Pharmacist confirms at the counter. | Shows the state rule. |
| | UC-Visit-03 Decline or Refer | Pharmacist stops with a reason. | Reason is stored. |
| | UC-Visit-04 Record Dose | Pharmacist records once. | Feeds the report and proof. |
| REQ-008 Registry Report and Proof | UC-Proof-01 Report to Registry | Dose goes to the registry. | Status shown (A). |
| | UC-Proof-02 Generate Proof | Pharmacist-signed record is produced. | PDF and link. |
| | UC-Proof-03 Share Proof with School | Parent sends proof. | Link or PDF. |
| | UC-Proof-04 Send Next-Dose Reminder | Parent is reminded of the next dose. | Uses the interval table. |
| REQ-009 School Drives and Notices | UC-School-01 Create School Drive | Nurse sets a drive. | Creates a QR code and slots. |
| | UC-School-02 Accept Drive | Partner pharmacy confirms. | Confirms capacity. |
| | UC-School-03 Notify Families | Nurse shares the link. | Message template. |
| | UC-School-04 View Drive Completion | Nurse sees aggregate counts. | No child names unless shared. |
| REQ-010 Analytics and Administration | UC-Admin-01 View Campaign Funnel | MedMe staff sees the funnel. | Counts by store and school. |
| | UC-Admin-02 Maintain State Rules | Admin edits rules. | Audit log. |

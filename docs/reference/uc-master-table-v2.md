# MedMe School Vaccines: UC Master Table (v2)

Source: Claude Doc "UC Master Table v2". Copied into the repo as a governing reference. (A) means the item depends on answers from Nick or from pharmacists. Build status and work items for each row are in `traceability.md`.

| REQ | Use case ID | Title | Notes |
| --- | --- | --- | --- |
| REQ-001 Profile and Consent | UC-Profile-01 | Create Parent Account | Code verification |
| | UC-Profile-02 | Add Child Profile | Minimum data |
| | UC-Profile-03 | Record Parent Consent | (A) state consent rule |
| REQ-002 Entry and Authentication | UC-Entry-01 | Open from QR or Link | Link carries school ID |
| | UC-Entry-02 | Sign In | Passwordless code |
| | UC-Entry-03 | Manage Session | 30-minute idle timeout |
| REQ-003 Records Retrieval | UC-Record-01 | Pull Registry Record | (A) registry access |
| | UC-Record-02 | Enter Record Manually | Requirement shown beside fields |
| | UC-Record-03 | Upload Record Photo | Pharmacist reviews the image |
| REQ-004 Missing-Shot Check | UC-Check-01 | Run Missing-Shot Check | State rules table |
| | UC-Check-02 | Show Earliest Dates | Interval table |
| | UC-Check-03 | Select Vaccines to Book | Nothing preselected |
| REQ-005 Pharmacy Matching | UC-Match-01 | Publish Accepted Vaccines | Warns on state limits |
| | UC-Match-02 | Search Eligible Pharmacies | Vaccine, age, location filters |
| | UC-Match-03 | Show Fallback Options | Directory by state |
| REQ-006 Cost Check and Booking | UC-Book-01 | Check Insurance and Cost | (A) cost before confirming |
| | UC-Book-02 | Choose Slot | Pharmacy capacity |
| | UC-Book-03 | Send Reminders | Text or email |
| | UC-Book-04 | Reschedule or Cancel | Frees the slot |
| REQ-007 Visit Documentation | UC-Visit-01 | View Pre-filled Appointment | No repeated questions |
| | UC-Visit-02 | Verify Consent and Eligibility | Shows the state rule |
| | UC-Visit-03 | Decline or Refer | Reason stored |
| | UC-Visit-04 | Record Dose | Once; feeds report and proof |
| REQ-008 Registry Report and Proof | UC-Proof-01 | Report to Registry | (A) registry reporting |
| | UC-Proof-02 | Generate Proof | PDF and link |
| | UC-Proof-03 | Share Proof with School | Link or PDF |
| | UC-Proof-04 | Send Next-Dose Reminder | Interval table |
| REQ-009 School Drives and Notices | UC-School-01 | Create School Drive | QR code and slots |
| | UC-School-02 | Accept Drive | Pharmacy confirms capacity |
| | UC-School-03 | Notify Families | Message template |
| | UC-School-04 | View Drive Completion | Aggregate counts only |
| REQ-010 Analytics and Administration | UC-Admin-01 | View Campaign Funnel | By store and school |
| | UC-Admin-02 | Maintain State Rules | Audit log |

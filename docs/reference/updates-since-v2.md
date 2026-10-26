# Updates since v2

The three v2 documents in this folder are the governing source for the build. This file records decisions made after 2026-10-20. Where it disagrees with a v2 document, this file wins until the v2 doc is edited. Each item names the REQ or UC it changes.

| # | Change | Touches | Status in app |
| --- | --- | --- | --- |
| U-01 | School status uses categories: complete, in process, incomplete, insufficient, nonmedical exemption, medical exemption, no record, no rules on file. "Up to date" in Flow 1 maps to complete or in process. | REQ-004, UC-Check-01, UC-Admin-01 | Built (W-97) |
| U-02 | Exemptions are recorded per student (type, vaccines covered, document date) and shown as their own category, never as "missing". | REQ-004 | Built |
| U-03 | Record errors are flagged: missing date, dose before birth, duplicate date, unsigned certificate. These count as "insufficient". | UC-Record-02, UC-Record-03 | Built |
| U-04 | Each state rule records who may sign the school certificate and whether a pharmacy-signed record is accepted (yes, no, unknown). Flow 5 Decision 2 ("Show Form + Signer") reads this. Georgia Form 3231 is signed by a physician, APRN, PA or health department employee; pharmacists are not listed, so GA shows "unknown, check with the school". | REQ-008, UC-Proof-02, UC-Proof-03 | Data built; parent proof screen not yet reading it |
| U-05 | Key dates per state (annual report due, exclusion day) are data with source and reviewed date, all unverified. | REQ-010, UC-Admin-01 | Built (W-100) |
| U-06 | School administrators get the government report worksheet: counts by grade and category, on screen and as CSV. It is a worksheet to copy from, not a filing. | REQ-009, REQ-010 | Planned (W-103, W-104) |
| U-07 | State rules table editor requires a source URL and reviewer date before a rule can be saved as verified. | REQ-010, UC-Admin-02 | Planned (W-26) |
| U-08 | Unverified rules stay labeled in every screen. A state with no entry shows "No rules on file, check with the state health department". | REQ-004, UC-Check-01 | Built |
| U-09 | Drafted messages are templates a human approves. They cover scheduling and confirmation only. | UC-School-03, UC-Book-03 | Partly built (W-41) |
| U-10 | The administrator view is a roster-first workspace (directory, profile, categories, outreach), not a drive-only view. The drive flow (Flow 6) is kept and still required. | REQ-009, REQ-010 | Roster built; drive creation planned (W-70) |
| U-11 | MedMe is likely live in California, Georgia, Oregon, Idaho and North Carolina. Rules for these come first. Only California is confirmed publicly. Others are unverified. | REQ-004, UC-Admin-02 | OR and NC and GA have entries; CA and ID partial |
| U-12 | Costs shown to a parent are fake sample prices. No MedMe revenue or fee logic appears anywhere. | REQ-006, UC-Book-01 | Built |
| U-13 | The demo runs on fake data in the browser. Registry pull and report (A items) are simulated and tagged `DEMO-FAKE`. | REQ-003, REQ-008 | Built |

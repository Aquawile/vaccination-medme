# MedMe School Vaccines Prototype: PRD

Status: draft v1, 2026-10-25. Applies to branch `staging`. Owner: Isabella. Reference documents (kept in Claude Docs, listed in section 11): Core User Flows, Requirements and Use Cases, UC Master Table, Prototype PRD and AI Build Guide.

## 1. Purpose

Show MedMe's founder one thing: a parent can go from a school notice to a booked, recorded and provable vaccination, with MedMe in the middle, and the hard parts work. Those hard parts are (a) telling the parent exactly which school-required vaccines are missing, (b) matching the child to a pharmacy or clinic that will actually take them under that state's rules, and (c) recording the dose once and producing proof and a registry report.

The prototype is a demo on fake data. The next version has to hold up with hundreds of students, three roles, and any state.

## 2. Where the prototype stands today

The repo already contains a working Figma Make export (React 19, Vite 8, Tailwind v4, about 4,400 lines). It builds, and all 18 Playwright tests pass at mobile, tablet and desktop sizes.

Working today:

- Sign-in for three demo accounts. Parent: `parent@example.test`, pharmacist: `pharmacist@example.test`, administrator: `admin@example.test`, password `Demo123!` (fake, local only).
- Parent: school notice, child details, record retrieval (simulated), manual record, photo filename attachment, vaccine selection, 4-step booking (location, date and time, cost, review and consent), appointment history, cancellation, calendar download, proof PDF and share.
- Pharmacist: schedule list, appointment detail, 4-item review checklist, signed dose entry (once per vaccine), decline or refer, registry report simulation, CSV export fallback.
- Administrator: funnel counters, student lookup, vaccination tracker bars, appointments table with demo school acceptance, scenario controls, editable sample rules.

Gaps found by reading every file (these drive the work below):

| Gap | Evidence |
| --- | --- |
| There is no missing-shot check. DTaP dose 5 and IPV dose 4 are hard-coded as always missing, with a fixed earliest date. | `src/demo/config.ts` `vaccines` |
| The rules table is display-only. No logic reads it. | `initialData.rules`, `Admin.tsx` |
| No state concept. Eligibility is a per-store age range, a vaccine list and a prescription flag. | `eligibility()` in `src/demo/journey.ts` |
| The no-eligible-pharmacy fallback cannot be reached because one clinic accepts ages 0 to 18. | `locations` in `journey.ts` |
| The funnel supports one child only. "Profiles created" is 0 or 1. | `Admin.tsx` metrics |
| No scale. Lists are plain, unpaginated, unfiltered. | `Pharmacist.tsx`, `Admin.tsx` |
| Dates are fixed to September 2026. | `defaults.referenceDate`, `bookingDates` |
| "AI follow-up draft" is a fixed template, not AI. | `Pharmacist.tsx` |
| About 60 hard-coded colors beside the theme variables; `--pink` holds lime; a beige, a pink and a purple leftover. | `src/index.css`, `documents.ts` |
| 2 TypeScript errors; no unit tests; no CI; two lockfiles; `AGENTS.md` is Figma Make boilerplate. | `tsc`, repo root |

## 3. Principles

1. The parent decides. The app never recommends a vaccine or an age. It shows what a school lists as required and what is missing against that list, with the source.
2. Honest labels. Anything not verified against an official source says so on screen. Anything faked says so in code (`DEMO-FAKE`).
3. Rules are data. State, school, store, vaccine and insurer differences live in data files so a founder's or pharmacist's answer changes a file, not the code.
4. Built for scale. Every list works with hundreds of students.
5. One theme. Colors, spacing and components come from shared tokens and primitives.
6. Hardest part first. The missing-shot check and state rules come before polish. If those are wrong nothing else matters.

## 4. Roles

| Role | Demo account | Job in the prototype |
| --- | --- | --- |
| Parent | `parent@example.test` | See what is missing, book, get proof, get confirmation |
| Pharmacist | `pharmacist@example.test` | Run the schedule, record doses once, confirm the visit to the parent |
| Administrator (school and campaign) | `admin@example.test` | See coverage, find students, schedule follow-ups, maintain rules |

Pharmacy owner and school nurse flows from the flows document are covered by the pharmacist and administrator roles for now (see W-70).

## 5. Work items

Priority: P0 must exist for the demo, P1 should, P2 if time. "UC" columns point to the UC Master Table.

### A. Core logic: the absent vaccinations

| ID | Pri | Work item | Acceptance criteria | UC |
| --- | --- | --- | --- | --- |
| W-01 | P0 | Missing-shot check in `src/domain/`. Compare a child's recorded doses to the school requirement for their state and grade. Per vaccine the status is one of: complete, missing (n doses), not yet due (earliest date), unknown (no record). Child level: up to date, missing, or unknown. | Given a record and rule set, the function returns the same result in tests for: no record, complete record, one dose short, dose not yet due, unknown state, exact-boundary age. Source and verification status come back with every result. Nothing is recommended. | UC-Check-01, 02 |
| W-02 | P0 | Structured vaccination record. Replace the free-text manual entry with doses (vaccine, date, source: registry, parent, pharmacy). Doses recorded by the pharmacist join the same history. | Manual entry picks from the school's required vaccines and shows the requirement beside each field. History merges all sources and labels each. | UC-Record-01 to 03 |
| W-03 | P0 | State pharmacist-authority rules as data (`src/data/stateRules.json`) for all 50 states plus DC with a status per state: `read-on-official-page`, `unverified`, `not-researched`. Seed only what has been read (table below). `eligibility()` reads this file together with the store's own settings. | Changing a rule changes who appears in pharmacy search with no code change. A `not-researched` state shows "No rules on file, check with the state health department". | UC-Match-01, 02, UC-Admin-02 |
| W-04 | P0 | School entry requirements as data (`src/data/schoolRequirements.json`), by state and grade, separate from W-03. Seed Oregon with the current sample, marked `unverified`. | Admin can see and edit each requirement with its source link and status. | UC-Check-01 |
| W-05 | P1 | Dose intervals as data (`src/data/intervals.json`), placeholders marked `SAMPLE`. | Earliest allowed date per missing dose is computed from the last dose and the interval. Placeholder values are flagged in the UI. | UC-Check-02 |
| W-06 | P0 | No-eligible-pharmacy fallback. | With a child no store accepts, parent sees the health department and pediatric office options instead of an empty list. A test reaches this screen. | UC-Match-03 |
| W-07 | P1 | Relative dates. Reference date is today. Booking days are the next N weekdays. | No test or screen depends on a fixed calendar date. | UC-Book-02 |

State rules known so far (copy into `stateRules.json`; all other states start `not-researched`):

| State | What we read | Status |
| --- | --- | --- |
| Oregon | Pharmacists may give all ACIP vaccines from age 7. Any age with a prescription. No separate ages 3 to 6 provision. | Read on official state page |
| North Carolina | With a prescription, ages 6 and up (prescriber must have examined the child). Without one, only flu and COVID from age 7. Other vaccines without a prescription are 18 and up. Written parental consent under 18. The Board FAQ says the federal PREP declaration covers routine childhood vaccines for ages 3 to 18 through 2029; the end date for that category is not confirmed, so no date logic. | Read on Board FAQ |
| Georgia | Needs a physician agreement. Form 3231 signed by a physician, NP, PA or health department. | Read on official page |
| California | Independent administration from age 3. | From a secondary report, unverified |

"Works for every state" means the data model and screens handle every state from day one and honestly show how much is researched. Researching all 50 is a separate, ongoing task (W-80), not something to invent in code.

### B. Students at scale and easier navigation

| ID | Pri | Work item | Acceptance criteria | UC |
| --- | --- | --- | --- | --- |
| W-10 | P0 | Fake roster generator. About 300 students across 3 schools and grades K to 5, deterministic seed, invented names, a realistic mix of up to date, missing and unknown. | Same seed gives the same roster. Roster loads in under 1 second. No real names. | UC-School-04 |
| W-11 | P0 | Student directory (admin tab). Search by name, filters (school, grade, vaccination status, missing vaccine, appointment status), sort, pagination or virtual scroll, result count, list or table with a density toggle instead of only cards. | At 300 students, finding a named student takes under 5 seconds and the page stays responsive. Filters combine. | UC-School-04, UC-Admin-01 |
| W-12 | P0 | Student profile page, one per child ("page of info in each kid"): overview, vaccination tracker (vaccines complete of required), history timeline, appointments, messages, proof. Reachable from the admin directory and the pharmacist schedule. | Opens from any list. Shows complete versus missing per vaccine with source. Back returns to the same filtered list position. | UC-Check-01, UC-Visit-01 |
| W-13 | P0 | Pharmacist schedule at scale: date filter, search, status filter, grouping by time, count badges. | With 100+ appointments in a day the schedule is searchable and filterable. | UC-Visit-01 |
| W-14 | P1 | Calendar view next to the list (pharmacist day and week, parent upcoming visits). | Toggle between list and calendar. Clicking a slot opens the appointment. Keyboard accessible. | UC-Book-02, UC-Visit-01 |

### C. Administrator

| ID | Pri | Work item | Acceptance criteria | UC |
| --- | --- | --- | --- | --- |
| W-20 | P0 | Admin tabs: Overview, Students, Appointments, Vaccination tracker, Follow-ups, Rules. | Each tab is a section of the same page route, not a new app screen. State is kept when switching tabs. | UC-Admin-01 |
| W-21 | P0 | Clickable boxes expand inline with more information (they do not open new pages). Boxes carry more info than a number: trend, definition, what counts, link into the student list filtered to that group. | Expand and collapse by mouse and keyboard. One open at a time is fine. | UC-Admin-01 |
| W-22 | P0 | Cohort box: children with vaccinations and children without. Counts, percent, expandable list into the filtered directory. "Without" means missing any required vaccine versus the requirement, and the box says "unknown" separately where no record exists. | Counts match the directory filters exactly. | UC-School-04 |
| W-23 | P1 | Vaccination tracker view: coverage by vaccine, school and grade. | Numbers are computed from the roster, not typed in. | UC-Admin-01 |
| W-24 | P0 | Remove "Recent activity". Keep the internal event log only to feed counts. | No activity feed anywhere in the UI. | none |
| W-25 | P0 | Archive "Demo scenario controls". Remove from the admin UI. Keep the controls reachable at `#dev` (or `?dev=1`) for tests and the presenter. | Admin shows no scenario controls by default. Tests reach them through the hidden route and still pass. | none |
| W-26 | P1 | Rules tab: edit by state and vaccine with source link, status and reviewer date; changes are logged. | A rule cannot be saved as `read-on-official-page` without a source URL. | UC-Admin-02 |

### D. Parent

| ID | Pri | Work item | Acceptance criteria | UC |
| --- | --- | --- | --- | --- |
| W-30 | P0 | New "Records" page. Move vaccination history and record sources out of the requirements screen. Keep "Doses to review" (what is missing) separate from "History" (what is recorded). | Two clearly separate pages. History is a timeline with a vaccine filter and shows the source of each entry. | UC-Record-01 to 03 |
| W-31 | P0 | Visit confirmation inbox. When the pharmacist confirms a visit, the parent sees a message with the doses recorded and can mark it received. | Parent sees an unread count. Acknowledging updates the pharmacist and administrator views. | UC-Proof-02, 03 |
| W-32 | P1 | Parent sees upcoming visits in list and calendar (see W-14). | See W-14. | UC-Book-02 |

### E. Pharmacist and follow-ups

| ID | Pri | Work item | Acceptance criteria | UC |
| --- | --- | --- | --- | --- |
| W-40 | P0 | The pharmacist must confirm the outcome to the parent: after the doses are saved (or the visit is declined or referred) a "Send visit confirmation" action creates the parent message. An appointment cannot show as closed until the confirmation exists. | Status shows pending, sent, acknowledged. Declined visits send a referral message. | UC-Visit-03, 04, UC-Proof-02 |
| W-41 | P0 | Follow-ups, made honest. Rename "AI follow-up draft" to "Suggested follow-up (template)". Messages cover confirmation and scheduling only, never clinical advice, and a person edits and approves before sending. If a real model is added later, label it as AI and keep the same limits. | No screen says AI unless a model is called. Follow-up text is editable. | UC-Proof-04 |
| W-42 | P0 | School can schedule a follow-up directly (administrator): per student or per selected group from the directory, with date and message, shown in the pharmacist and parent views. | Scheduling a follow-up for 20 selected students takes one action and appears in each student's profile. | UC-School-03 |

### F. Cross-cutting

| ID | Pri | Work item | Acceptance criteria | UC |
| --- | --- | --- | --- | --- |
| W-50 | P0 | Easy account switching. A "Switch account" menu in the header lists Parent, Pharmacist, Administrator and switches without re-entering a password, keeping all data. Demo only, tagged `DEMO-FAKE`. | Switching takes one click from any screen and returns to that role's home. | none |
| W-51 | P1 | MedMe logo in the header, sign-in and PDF. Use a `Logo` component with a placeholder until the real asset is supplied. | No logo is invented. Real file goes in `public/` and is wired in one place. | none |
| W-52 | P0 | One consistent theme: move every raw hex into named variables, rename misleading variables, map them into Tailwind `@theme`, replace leftover beige, pink and purple accents, and add shared Tabs, Table, Calendar and Modal primitives. | `grep` for hex in `src/**/*.tsx` returns none; the CSS file only defines each color once in the variables block. Tests for contrast still pass. | none |
| W-53 | P1 | Better PDF summary: header with logo and campaign, child block, per-vaccine table (required, given, date, lot, source), registry status, page footer, clear "Demo, not valid proof" marking. | PDF renders cleanly for 1 dose and for 6 doses, multi-page safe. | UC-Proof-02 |
| W-54 | P1 | Demo script in `docs/demo-script.md` that matches the app (accounts, steps, which cases to show). | Someone who did not build the app can follow it cold. | none |

### G. Engineering

| ID | Pri | Work item | Acceptance criteria |
| --- | --- | --- | --- |
| W-60 | P0 | Fix the 2 TypeScript errors in `Admin.tsx`. Add scripts `typecheck`, `test:unit`, `test` to `package.json`. Add Vitest and unit tests for everything in `src/domain/`. | `pnpm typecheck` passes. Domain coverage includes the cases in W-01. |
| W-61 | P0 | CI workflow (`.github/workflows/ci.yml`): install, typecheck, build, unit tests, Playwright. Single lockfile (pnpm; remove `package-lock.json`). | Pull requests into `staging` show a green check or a red one. |
| W-62 | P1 | Split the large screens (`Pharmacist.tsx`, `Booking.tsx`, `Admin.tsx`, each over 500 lines) into smaller components without changing behavior. | Existing tests pass unchanged. |
| W-63 | P1 | `CHANGELOG.md`, pull request template, and a short `README.md` with run and test instructions. | A new teammate runs the app and tests from the README alone. |

### H. Later

| ID | Pri | Work item |
| --- | --- | --- |
| W-70 | P2 | Dedicated pharmacy-owner settings screen (vaccines, youngest age per vaccine, capacity, hours, insurance) and school-nurse drive creation, from User Flows 3 and 6. |
| W-71 | P2 | Registry connection beyond the simulation, if MedMe confirms it is possible. |
| W-72 | P2 | Multi-child parent accounts. |
| W-80 | ongoing | Research state rules and school requirements for the remaining states from official sources, one state per pull request, each with source URL and reviewer date. |

## 6. Data model sketch

```ts
type VerificationStatus = "read-on-official-page" | "unverified" | "not-researched"

type StateRule = {
  state: string
  minAgeNoRx: number | null
  minAgeWithRx: number | null
  prescriptionRequired: boolean
  parentPresentRequired: boolean
  consentType: "parent-signed" | "verbal" | "unknown"
  vaccinesNoRx: string[] | "all-acip" | "unknown"
  sourceUrl: string
  status: VerificationStatus
  lastReviewed: string
}

type Requirement = { state: string; grade: string; vaccineId: string; dosesRequired: number; sourceUrl: string; status: VerificationStatus }
type Dose = { vaccineId: string; date: string; source: "registry" | "parent" | "pharmacy"; lot?: string; signedBy?: string }
type Student = { id: string; name: string; birthDate: string; grade: string; school: string; state: string; doses: Dose[]; appointmentIds: string[] }
type VaccinationStatus = "complete" | "missing" | "not-yet-due" | "unknown"
type VisitConfirmation = { appointmentId: string; status: "pending" | "sent" | "acknowledged"; sentAt?: string; message: string }
type FollowUp = { id: string; studentIds: string[]; date: string; message: string; createdBy: "pharmacist" | "administrator"; approved: boolean }
```

## 7. Demo cases the app must be able to show

- Golden path: Oregon, child age 7, two missing doses, eligible pharmacy, cost shown, booked, dose recorded once, confirmation sent and acknowledged, proof shared, appears in admin coverage.
- No eligible store: a child no store accepts shows the fallback.
- Prescription state: a North Carolina child shows the prescription requirement before booking.
- Unknown state: shows "No rules on file" instead of guessing.
- Scale: admin finds one student among about 300 by name, filters the "without vaccination" cohort and schedules follow-ups for a group.

## 8. Success measures for the prototype

Judged by the founder demo, not by usage numbers: the three hard parts above work on screen; a viewer can switch roles in one click; the admin view stays usable with 300 students; nothing on screen implies clinical advice, verification that has not happened, or MedMe revenue.

## 9. Delivery order and demo script outline

1. M1, logic first: W-01, W-02, W-03, W-04, W-06, W-60, W-61.
2. M2, scale and admin: W-10, W-11, W-12, W-13, W-20, W-21, W-22, W-24, W-25.
3. M3, connected flows: W-30, W-31, W-40, W-41, W-42, W-50.
4. M4, polish: W-52, W-14, W-51, W-53, W-05, W-07, W-23, W-26, W-54, W-62, W-63.

Demo script outline (to be written as W-54): sign in as parent, review what is missing, book, switch to pharmacist, record and confirm, switch to parent to acknowledge, switch to administrator to show coverage, the student directory and a group follow-up. Then show the no-eligible-store and North Carolina cases.

## 10. Open items waiting on people

| Item | Waiting on | Prototype default until answered |
| --- | --- | --- |
| Where MedMe is live in the US | MedMe founder | Oregon and North Carolina as sample states |
| Whether MedMe already handles minors and consent | MedMe founder | Parent-signed consent captured in the app |
| How a child's shot is billed and whether MedMe can check the cost | MedMe founder | Fake price and coverage responses |
| Registry reporting: real or export only | MedMe founder | Simulated status plus CSV export |
| Whether schools accept pharmacy proof | Schools, pharmacists | Pharmacist-signed PDF and link, demo acceptance flag |
| Official MedMe logo and brand colors | Team | `Logo` placeholder and current tokens |
| Which states to research first | Team | Oregon, North Carolina, Georgia, California |

## 11. Team and non-code deliverables

From the team notes, outside this repo: deck structure and content (Mayu), one-pager (Mayu, maybe), memo (Eva), demo changes (Izzy), recording the demo on Loom or similar, demo script. The demo script (W-54) is the only item that lives here.

Reference documents in Claude Docs: MedMe School Vaccines Core User Flows, Requirements and Use Cases, UC Master Table (all v2), and Prototype PRD and AI Build Guide. Where this PRD and those documents disagree, this PRD wins for the prototype; update the documents afterward.

## 12. Edit map: what changes in which file

This is the plan for the code. Nothing in this section is done yet. File paths are relative to the repo root.

### Do not touch

`vite.config.ts`, `.figma/**`, `index.html`, `AGENTS.md`, `.mise.toml`, and anything on `main`. Do not add a router or state library; use a small hash-based view switch and the existing React context.

### New files

| File | Purpose | Work items |
| --- | --- | --- |
| `src/domain/dates.ts` | `ageAt`, `addDays`, weekday generator, all taking the date as an argument | W-01, W-07 |
| `src/domain/missingShots.ts` | `getMissingShots(student, requirements, intervals, today)` and `getChildStatus` | W-01, W-05 |
| `src/domain/eligibility.ts` | `eligibility(store, child, vaccines, stateRule, today)` returning reasons that quote the rule and its source | W-03, W-06 |
| `src/domain/roster.ts` | `generateRoster(seed, size)` deterministic fake students | W-10 |
| `src/domain/cohorts.ts` | counts for vaccinated, not vaccinated, unknown, by school, grade and vaccine | W-22, W-23 |
| `src/domain/*.test.ts` | Vitest tests beside each module | W-60 |
| `src/data/stateRules.json` | all states, researched ones seeded from section 5 table | W-03 |
| `src/data/schoolRequirements.json` | state, grade, vaccine, doses, source, status | W-04 |
| `src/data/intervals.json` | placeholder intervals marked `SAMPLE` | W-05 |
| `src/data/vaccines.ts` | vaccine ids, names, details (replaces the array in `config.ts`) | W-01 |
| `src/data/pharmacies.ts` | stores with state, youngest age per vaccine, prescription flag, hours, capacity, fake prices | W-03, W-06 |
| `src/components/Logo.tsx` | logo placeholder, one place to swap in the real asset | W-51 |
| `src/components/Tabs.tsx`, `DataTable.tsx`, `Calendar.tsx`, `Expandable.tsx`, `Modal.tsx`, `FilterBar.tsx`, `Pagination.tsx` | shared primitives | W-11, W-14, W-20, W-21, W-52 |
| `src/screens/admin/` (`Overview`, `Students`, `Appointments`, `Tracker`, `FollowUps`, `Rules`) | admin tabs | W-20 to W-26 |
| `src/screens/StudentProfile.tsx` | one page per child | W-12 |
| `src/screens/parent/Records.tsx`, `Messages.tsx` | records page and visit confirmation inbox | W-30, W-31 |
| `src/screens/Dev.tsx` | archived scenario controls, reached at `#dev` | W-25 |
| `tests/unit/` | optional home for non-Playwright tests if Vitest config needs it | W-60 |
| `.github/workflows/ci.yml`, `.github/pull_request_template.md` | CI and PR template | W-61, W-63 |
| `README.md`, `CHANGELOG.md`, `docs/demo-script.md` | run instructions, history, demo script | W-54, W-63 |

### Existing files

| File | Edits | Work items |
| --- | --- | --- |
| `src/demo/config.ts` | Remove the hard-coded `vaccines` array, `initialData.rules` and the 50-state list (they move to `src/data`). Add a `demoAccounts` list (email, role, label) for the switcher. Replace the fixed `referenceDate` with a function that returns today. Keep `accountRoles` and the demo password. Update the `DemoData` type. | W-01, 03, 04, 07, 50 |
| `src/demo/journey.ts` | Move `locations` to `src/data/pharmacies.ts` and add a state and per-vaccine youngest age. Move `ageAt` and `eligibility` to `src/domain`. Generate `bookingDates` from today. Add to `Appointment`: `confirmation` (`pending`, `sent`, `acknowledged`), `confirmationMessage`, `studentId`. Extend `appointmentStatus` with "Awaiting confirmation". Remove or relabel the seeded appointment. | W-03, 06, 07, 40 |
| `src/demo/services.ts` | Bump the storage key to `school-demo-data-v2` with a migration from v1. `createBooking` calls the domain eligibility and requirement check. `saveDose` also writes to the student's history. Add `sendVisitConfirmation`, `acknowledgeConfirmation`, `scheduleFollowUp`, `switchAccount`, roster loading. All `DEMO-FAKE` tagged. | W-02, 40, 41, 42, 50 |
| `src/demo/documents.ts` | Rewrite the PDF: header with logo and campaign, child block, per-vaccine table with source, registry status, footer, multi-page safe, "Demo, not valid proof" marking. Take colors from one constants object that mirrors the CSS tokens (PDFs cannot read CSS variables). Replace the pink square. CSV export gains a source column. | W-53, 52 |
| `src/state.tsx` | Add roster, confirmations and follow-ups to state and expose selectors. Keep the existing `update` and `event` API so current screens keep working during the migration. | W-10, 31, 42 |
| `src/App.tsx` | Header: logo, "Switch account" menu, role label. Add a hash-based view switch for `#student/<id>` and `#dev`. | W-12, 25, 50, 51 |
| `src/index.css` | Collapse the palette into named variables in one block, rename `--pink` and `--jade`, remove the beige, pink and purple leftovers, map variables into Tailwind `@theme`. Add styles for Tabs, DataTable, Calendar, Expandable and the density toggle. Consider splitting into `tokens.css` and `components.css`. | W-52 |
| `src/components/ui.tsx` | Keep current primitives and class names. Add `StatusBadge` (complete, missing, not yet due, unknown) and `SearchInput`. | W-52 |
| `src/components/RecordPanel.tsx` | Becomes part of the Records page. Manual entry picks from the school's required vaccines, with the requirement shown beside each field. Photo stays filename-only. | W-02, 30 |
| `src/components/Proof.tsx` | Use the new PDF, show confirmation status and sources. | W-53, 31 |
| `src/screens/Parent.tsx` | Split into home, requirements (driven by `getMissingShots`, no hard-coded two vaccines or "of 2 selected"), Records and Messages. Remove the hard-coded "Oregon" labels; the state comes from the child's school. Add nav items Records and Messages with unread count. | W-01, 30, 31 |
| `src/screens/Booking.tsx` | Eligibility reasons come from the domain and quote the state rule and its source. Show prescription and parent-present requirements before booking. Add the no-eligible fallback. Dates from today. Split the four steps into separate files. | W-03, 06, 07, 62 |
| `src/screens/ParentAppointments.tsx` | List and calendar toggle, show confirmation status, fix the ICS timestamp to the current time. | W-14, 32 |
| `src/screens/Pharmacist.tsx` | Date, search and status filters, pagination, calendar toggle, link to the student profile. Add "Send visit confirmation" and block closing until it exists. Rename the follow-up card to "Suggested follow-up (template)" and make the text editable with an approve step. Split into schedule and detail components. | W-13, 14, 40, 41, 62 |
| `src/screens/Admin.tsx` | Becomes a thin tab container. Move content into `src/screens/admin/*`. Remove scenario controls (go to `Dev.tsx`). Remove any activity feed. Fix the two type errors: type `metrics` as `[string, number][]` so `setOpenMetric` receives a string. Metric boxes use `Expandable`. Add the cohort box. | W-20 to W-25, 60 |
| `src/screens/Auth.tsx` | Add the logo. Add one-click fill for the three demo accounts. | W-50, 51 |
| `tests/journey.spec.ts`, `tests/edgecases.spec.ts` | Update for new labels and tabs. Reach scenario controls through `#dev`. Add tests: missing-shot results, fallback, North Carolina prescription banner, directory search and filters at 300 students, account switching, visit confirmation, follow-up scheduling. Remove date dependence. | W-60 |
| `package.json` | Add scripts `typecheck`, `test:unit`, `test`. Add Vitest. Keep `pnpm` as the only package manager. | W-60, 61 |
| `package-lock.json` | Delete (keep `pnpm-lock.yaml`). | W-61 |
| `playwright.config.ts` | Leave behavior as is; document the base URL in the README. Optionally add a `webServer` block only if the team agrees. | W-63 |

### Pull request sequence

Each pull request goes into `staging`, passes type check, build and tests, and does not break the golden path.

1. PR A, logic and data, no visible change: `src/domain`, `src/data`, unit tests, Vitest, type error fix, CI, single lockfile (W-01 to W-06, W-60, W-61).
2. PR B, wire logic into the parent flow: requirements screen, booking eligibility, fallback, structured records (W-01, 02, 03, 06, 07).
3. PR C, scale and admin: roster, directory, tabs, expandable boxes, cohort box, scenario controls moved to `#dev` (W-10, 11, 20 to 25).
4. PR D, student profile and pharmacist at scale: profile page, schedule filters, calendar (W-12, 13, 14).
5. PR E, communication: records page, visit confirmation inbox, honest follow-ups, group scheduling (W-30, 31, 40, 41, 42).
6. PR F, theme and polish: tokens, shared primitives, logo placeholder, account switcher, PDF (W-50 to W-53).
7. PR G, docs and demo: README, CHANGELOG, demo script (W-54, W-63).

### Risks to watch

- The existing tests use visible text such as button labels. Keep labels stable where you can, and update tests in the same pull request when you cannot.
- Saved browser data from the old version must migrate or reset cleanly (new storage key plus a migration, tested).
- Every list must be tested with the 300-student roster, not just the 3-appointment seed.
- The PDF is hand-built with no library. Keep it dependency-free unless the team agrees to add one.
- Do not let the missing-shot check quietly pass when a rule is `not-researched`; it must return `unknown`.

## 13. How the UI changes by state

Decision: one code path, many data rows. We do not build a screen or a code branch per state. A state changes three things, all read from `src/data`: which rule applies to pharmacies, which school requirements apply, and which notices the parent sees. Adding a state is a data change in `stateRules.json` and `schoolRequirements.json`, never a code change.

**Where the state comes from.** The child's school has a state, and the school's state decides the requirement list. The store has a state, and the store's state decides which pharmacist rule applies. For a normal family these match. For the demo, the header shows "State: Oregon" with a "Change" menu (all 50 states plus DC) so the presenter can show any state. Changing it re-runs the missing-shot check and the pharmacy search immediately. In a real build the state would come from the school the parent picks at sign-up, with a "My child's school is in another state" link, not from a free setting.

**What the screens show, by rule status.**

| Status | Parent sees | Pharmacy list |
| --- | --- | --- |
| `read-on-official-page` | Full flow, rule source linked | Normal |
| `unverified` | Full flow, plus a visible "not checked against an official source" notice | Normal, notice on each store |
| `not-researched` | "No rules on file, check with the state health department" | Pharmacies hidden with that reason; clinics and health department options shown (W-06) |

Rule features that vary (prescription needed, written consent, physician agreement) appear as notices before booking, produced from the rule's fields. Three fields cover every state we have read so far, so a new state rarely needs a new field.

**Sustainability.** Researching every state by hand is not sustainable for the prototype and is not needed. Plan: ship the four researched states (OR, NC, GA, CA) plus the honest "no rules on file" path for everything else, then add states in the order MedMe's real footprint dictates (open item in section 10). One state per pull request, each with source URL and reviewer date. Until MedMe names its states, Oregon and North Carolina are the demo states because they show the two main behaviors (no prescription needed at 7, prescription needed).

**Status of data seeded in code:** all four rules are `unverified` because the source URLs from the research were not saved. Adding the URL and a reviewer date moves each to `read-on-official-page`.

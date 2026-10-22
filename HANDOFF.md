# Connected school vaccination demo

## Demo access

Sign in normally with `parent@example.test`, `pharmacist@example.test`, or `admin@example.test`. Default password: `Demo123!`. Registration assigns access from the email mapping and allows a custom demo password of at least eight characters. There is no public role selector.

## Implemented journey

1. Parent opens a fictional school notice (counted explicitly as a simulated scan), saves child details, reviews sample requirements, retrieves a fake registry record, enters a manual record, or attaches photo metadata for review.
2. Parent saves vaccine selections, finds a sample-eligible pharmacy or clinic, chooses a pharmacist or pediatric physician, selects a date/time, confirms sample insurance or self-pay cost, supplies guardian consent, and books.
3. Unknown cost blocks booking until a price or confirmed $0 is available. Sample availability and slot conflicts are rechecked at confirmation. Duplicate active bookings for the same child/vaccine are blocked.
4. Parent appointment history includes confirmation, calendar download, cancellation before dose recording, and dose summaries.
5. Clinician schedule contains both the separately labeled seed and new parent bookings. Each appointment has its own immutable booking snapshot, checklist, referral decision and individual signed dose entries. Repeated saves cannot duplicate a vaccine within an appointment.
6. Proof is generated only from saved administered doses. Partial proof is explicitly labeled. A real demo PDF downloads; device sharing is used when supported, otherwise the summary is copied to clipboard. Failed/cancelled sharing does not set the shared state.
7. Registry reporting is simulated with success/failure controls. A real CSV download supports manual-export fallback. Exporting does not mark doses reported.
8. Administrator funnel separates generated activity from seed examples and appointment counts from dose counts. Proof created, proof shared/copied, doses registry-reported, and school acceptance are independent. A clearly labeled admin demo acceptance checkbox requires shared proof and all selected doses saved.

## Where to edit

- `src/index.css`: palette anchors, typography, spacing, radii, responsive rules.
- `src/demo/config.ts`: email-to-role mapping, demo password, child/school defaults, vaccine labels and sample requirements.
- `src/demo/journey.ts`: fictional locations, clinicians, eligibility defaults, insurance response presets, dates/times, seed appointment and scenario defaults.
- `src/demo/services.ts`: simulated authentication, storage migration, cost quotes, booking and dose-save guards. Fake behavior is tagged `DEMO-FAKE`.
- `src/demo/documents.ts`: PDF proof, CSV export and file downloads.
- `src/state.tsx`: shared application state; `src/screens/`: workspace screens; `src/components/`: shared UI, records and proof.

Administrator scenario controls change registry availability, insurance service availability, reporting response, slot availability, sample prescription availability and the parent's record state. Rules support validated local editing of requirements, source and verification status; placeholder rules cannot be claimed verified.

## Persistence

Browser localStorage retains demo credentials, current session, child, selection, record source/manual entry/photo filename, booking draft, appointments, consent, checklists, signed doses, reporting acknowledgements, proof/share/acceptance flags, rules, scenario settings and activity. Signing out removes only the session. Clear site storage to reset. Existing milestone-one data is migrated without discarding the saved child, rules, selection or seeded-dose entries.

Booking snapshots intentionally do not change when the parent edits current child details or selects a different plan later. The independently seeded Sam appointment remains labeled as a seeded example. Photo contents are not stored or transmitted, only their filename; a clinician cannot inspect the actual image in this prototype.

## Simulation and integration boundaries

- No backend, database, secure authentication, real messages, insurance requests, payments, registry calls, live provider search or clinical guidance.
- Credentials are stored in local plaintext; role mappings ship in the frontend. Replace authentication and enforce authorization server-side before production.
- Eligibility, requirements, earliest dates, distance and cost are invented fixtures, not verified Oregon regulations. Clinical review is not an automated rules engine.
- Appointments use fixed September 2026 demo dates and Pacific time. A real system needs server-side slot holds, conflict resolution, time-zone handling and idempotency.
- Typed clinician names are demo signatures, not legally secure signing. Real proof must use verified records, signing and document-generation infrastructure.
- “Shared” means device-share completion or clipboard copy; it does not mean delivery, receipt, registry reporting or school acceptance. School acceptance is explicitly simulated by the administrator, not a real school integration.
- Storage is single-browser and intended for sequential role walkthroughs, not a multi-user production database or concurrent-tab conflict handling.
- Booking and dose safeguards are frontend demo guards, not production domain validation or security.
- No reference images were attached; the written visual direction and exact supplied palette guide the interface. Google fonts have sans-serif fallbacks.

## Verification

- Build: `pnpm build`
- TypeScript: `pnpm exec tsc --noEmit`
- Browser tests: `pnpm exec playwright test`
- Tests use the already-running host server (default `http://localhost:3000`) and system Chromium. Set `DEMO_BASE_URL` or `CHROMIUM_PATH` when exporting to another environment. Tests do not start a server.
- Projects cover 390px mobile, 820px tablet and 1440px desktop, with screenshots, overflow checks, validation, connected booking-to-proof flow, registration, record scenarios, cancellation, referral and reporting fallback.

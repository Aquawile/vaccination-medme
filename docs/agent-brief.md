# Brief for a new agent

Copy the block below into the agent's first message, filling in the lane. Everything it needs is in this repo; nothing depends on chat history.

```
You are working on the MedMe School Vaccines prototype (a click-through demo on fake data, no backend).
Your lane: <PARENT screens | PHARMACIST screens>. Do not edit files in other lanes.

Read these in order before changing anything:
1. CLAUDE.md and AGENTS.md (rules: branches, fake data only, the parent decides, unverified stays labeled, architecture, styling, tests, definition of done)
2. docs/reference/ the three v2 PDFs (Core User Flows, Requirements and Use Cases, UC Master Table). They are the governing source.
3. docs/reference/updates-since-v2.md (decisions made after the v2 documents)
4. docs/reference/traceability.md (status of every use case and which work item covers it)
5. docs/prd.md section 5 (work items) and section 10 (items waiting on people)
6. docs/parallel-agents.md (your folder, branch and port)

Set up: bash scripts/new-lane.sh <lane-name> <port>, open that folder in its own VS Code window, run the dev server on your port.
Work from the traceability table: pick use cases marked Gap or Partial in your lane, one per branch (feat/<work-item>-<name>), small commits, a Playwright test per flow at 390, 820 and 1440 widths, and a pull request into staging. Merge only when checks are green after saving backup/staging-<yyyymmdd>-<short sha>. Never touch main.
Update docs/reference/traceability.md and CHANGELOG.md in the same pull request as the behavior change.
If a state rule, price or legal fact is not in the repo or the PDFs, do not invent it: show "No rules on file", label it unverified, and list it as an open question in your pull request.
```

## First tasks by lane

Parent lane (screens: `Parent.tsx`, `Booking.tsx`, `ParentAppointments.tsx`, `Auth.tsx`):
- UC-Entry-01 school landing page from a QR or link (school name and state shown, then sign in)
- UC-Check-01 to 03 wire the missing-shot check and earliest dates into the parent screens, nothing preselected
- UC-Record-03 photo upload (kept in the browser, tagged DEMO-FAKE)
- UC-Proof-03 proof sharing that shows the form and who may sign it, read from `whoMaySign` and `acceptsPharmacyRecord` in `src/data/stateRules.json`
- UC-Proof-04 next-dose reminder from the interval table
- UC-Entry-03 30-minute idle timeout

Pharmacist lane (screens: `Pharmacist.tsx`):
- UC-Match-01 pharmacy owner settings (vaccines, youngest age, capacity, hours, insurance) with the state warning
- UC-Visit-02 show the state rule at the counter and block the visit when consent or a required prescription is missing
- UC-Visit-03 decline or refer with a stored reason
- UC-Book-04 reschedule and cancel freeing the slot

Administrator lane is owned by the first agent. Do not edit `src/screens/admin/`.

Shared files (`src/domain/types.ts`, `src/demo/config.ts`, `src/components/ui.tsx`, `src/index.css`) change in their own small commit so a merge conflict stays small.

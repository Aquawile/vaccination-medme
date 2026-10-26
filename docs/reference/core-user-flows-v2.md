# MedMe School Vaccines: Core User Flows (v2)

Source: Claude Doc "MedMe School Vaccines Core User Flows v2", dated 2026-10-20. Copied into the repo as a governing reference. Amendments made after this date are in `updates-since-v2.md`, not here.

Project: MedMe School Vaccines (school-required vaccine booking at pharmacies)

Target audience: parents and guardians, pharmacists and pharmacy owners, school nurses, and MedMe staff.

## Document overview

The product helps a parent find out which school-required shots a child is missing, find a pharmacy that will give them, and get proof the school accepts. The parent decides which vaccines to book, and the product never recommends a clinical action. Steps marked (A) depend on answers from Nick or from pharmacists.

## User Flow 1: Parent entry, child profile and missing-shot check

**Goal.** A parent who received a school notice about missing shots wants to find out exactly which shots their child still needs, without calling the school or the pediatrician.

**Page migrations.** School slip / email / pharmacy ad → Landing page → Sign-up / sign-in → Child profile → Records check → Missing shots list.

**Entry point.** QR code on a school slip, a link in a school email, or a MedMe pharmacy ad.

- Step 1: Parent scans the QR code or taps the link. The landing page shows the school name and state.
- Step 2: Parent signs in, or creates a light account with an email or phone number.
- Decision 1: Is the parent already signed in? If yes, skip to the child profile.
- Step 3: Parent enters the child's name, birth date, grade and school.
- Step 4: The system tries to pull the child's record from the state registry (A).
- Decision 2: Was a record found? If not, the parent types the doses or uploads a photo of the record.
- Step 5: The system compares the record to the state rule for that grade and lists missing doses with the earliest allowed dates.
- Decision 3: Are all required doses complete? If yes, show "up to date" and offer proof. If no, show the missing list and let the parent choose which vaccines to book.

```
[School Slip / Email / Pharmacy Ad]
 │
 ▼ (Action: Scan QR Code or Tap Link)
[Landing Page: School + State]
 │
 ▼ (Action: Sign In or Create Light Account)
[Child Profile Form] ──► (Action: Enter Name, Birth Date, Grade, School)
 │
 ▼ (Decision: Does the registry return a record?)
 ├── No ──► (Action: Type Doses or Upload Record Photo)
 └── Yes ──► [Show Pulled Record]
 │
 ▼
[Compare Record to State Rule for Grade]
 │
 ▼ (Decision: Are all required doses complete?)
 ├── Yes ──► [Display Up-to-Date Status + Proof Option]
 └── No ──► [Display Missing Shots List with Earliest Dates]
 │
 ▼ (Action: Select Vaccines to Book)
 [Continue to Pharmacy Search]
```

## User Flow 2: Parent pharmacy search, cost check and booking

**Goal.** A parent wants to find a nearby pharmacy that will give the chosen shots, know what it costs, and book a time.

**Page migrations.** Missing Shots List → Pharmacy List → Cost Check → Slot & Consent → Booking Confirmation.

**Entry point.** "Find a pharmacy" button on the Missing Shots List after the parent selects vaccines.

- Step 1: The system filters pharmacies by location, vaccines, the child's age and hours.
- Decision 1: Is any pharmacy eligible? If none, show the health department and pediatric office contacts with phone numbers.
- Step 2: Parent picks a pharmacy from the list.
- Step 3: Parent enters insurance details and the system runs an eligibility check (A).
- Decision 2: Is the shot $0 at this pharmacy? If yes, continue. If unknown or not covered, show the price and ask the parent to continue.
- Decision 3: Does the state require a prescription or a parent present? If yes, show the requirement before booking.
- Step 4: Parent picks a time slot and gives consent.
- Step 5: Parent receives a confirmation with what to bring, and reminders are scheduled.

```
[Missing Shots List]
 │
 ▼ (Action: Click "Find a Pharmacy")
[Filter by Location, Vaccines, Child Age, Hours]
 │
 ▼ (Decision: Is any pharmacy eligible?)
 ├── No ──► [Display Health Department + Pediatric Office Options]
 └── Yes ──► [Pharmacy List] ──► (Action: Select Pharmacy)
 │
 ▼ (Action: Enter Insurance Details)
 [Run Eligibility Check]
 │
 ▼ (Decision: Is the shot $0 here?)
 ├── Yes ──► [Continue]
 └── No / Unknown ──► [Show Price] ──► (Action: Parent Chooses to Continue)
 │
 ▼ (Decision: Prescription or parent presence required?)
 ├── Yes ──► [Show Requirement Before Booking]
 └── No ──► [Slot Picker + Consent Step]
 │
 ▼ (Action: Confirm Booking)
 [Booking Confirmation + Reminders Scheduled]
```

## User Flow 3: Pharmacy owner publishing accepted vaccines and capacity

**Goal.** A pharmacy owner or manager wants to show only the vaccines, ages and capacity the store will actually accept, so families are not turned away at the counter.

**Page migrations.** Pharmacy Dashboard → Service Settings → Vaccines & Ages → Capacity & Hours → Insurance Accepted → Publish Confirmation.

**Entry point.** "Back-to-school settings" link in the pharmacy account.

- Step 1: Owner ticks the vaccines the store gives and sets the youngest age for each.
- Decision 1: Does the state allow that age for that vaccine without a prescription? If not, show the rule and require a prescription option.
- Step 2: Owner sets daily capacity and hours for the school season.
- Step 3: Owner lists the insurance accepted and marks whether Medicaid and VFC patients are accepted.
- Decision 2: Is the pharmacy enrolled to serve those patients? If not, mark them as not accepted.
- Step 4: Owner publishes. Changes appear in parent search within a minute.

```
[Pharmacy Dashboard]
 │
 ▼ (Action: Open Back-to-School Settings)
[Vaccines & Ages] ──► (Action: Tick Vaccines, Set Youngest Age)
 │
 ▼ (Decision: Does state allow this age without a prescription?)
 ├── Yes ──► [Continue]
 └── No ──► [Show Rule + Require Prescription Option]
 │
 ▼
[Capacity & Hours] ──► (Action: Set Daily Capacity)
 │
 ▼
[Insurance Accepted] ──► (Decision: Enrolled for Medicaid / VFC?)
 ├── Yes ──► [Mark Accepted]
 └── No ──► [Mark Not Accepted]
 │
 ▼ (Action: Click "Publish")
 [Settings Live in Parent Search]
```

## User Flow 4: Pharmacist visit, dose recording and registry report

**Goal.** A pharmacist wants to give the shot, record it once, and have the registry report and proof produced without extra paperwork.

**Page migrations.** Daily Schedule → Appointment Detail → Eligibility & Consent Check → Record Dose → Sign Proof → Registry Report Status.

**Entry point.** Today's schedule in the pharmacy account.

- Step 1: Pharmacist opens the appointment. Child details, selected vaccines, consent and cost status are pre-filled.
- Decision 1: Does the child fit what this pharmacy gives (age, vaccine)? If not, refer the family and close the appointment.
- Decision 2: Are consent and any required prescription present? If not, hold the visit.
- Decision 3: Can the child be vaccinated safely today? If not, the pharmacist declines with a reason and the family is rescheduled or referred.
- Step 2: Pharmacist gives the shot and records vaccine, lot, site and time once.
- Step 3: Pharmacist signs the proof.
- Step 4: The system reports the dose to the state registry, or flags it for manual entry (A).

```
[Daily Schedule]
 │
 ▼ (Action: Open Appointment)
[Appointment Detail: Pre-filled Intake, Consent, Cost Status]
 │
 ▼ (Decision: Does the child fit this pharmacy's ages and vaccines?)
 ├── No ──► [Refer Family + Close Appointment]
 └── Yes
 │
 ▼ (Decision: Consent and any prescription present?)
 ├── No ──► [Hold Visit]
 └── Yes
 │
 ▼ (Decision: Safe to vaccinate today?)
 ├── No ──► (Action: Decline with Reason) ──► [Reschedule or Refer]
 └── Yes ──► (Action: Record Vaccine, Lot, Site, Time)
 │
 ▼
 [Sign Proof]
 │
 ▼
 [Report to Registry or Flag for Manual Entry]
```

## User Flow 5: Parent proof sharing and next-dose reminders

**Goal.** A parent wants to send proof to the school without chasing paperwork, and not miss the next dose in a series.

**Page migrations.** Visit Complete Message → Proof Page → Share with School → Next-Dose Reminder.

**Entry point.** Text or email sent after the visit.

- Step 1: Parent opens the proof page showing doses given, date, pharmacy and registry status.
- Decision 1: Has the dose been reported to the registry? If yes, show confirmed. If not, show pending.
- Decision 2: Does the state or school need a specific form? If yes, show the form and who must sign it.
- Step 2: Parent sends the proof to the school nurse as a link or PDF.
- Step 3: The system shows remaining doses and the date each is allowed.
- Decision 3: Are doses remaining? If yes, schedule a reminder. If no, show the series as complete.

```
[Visit Complete Message]
 │
 ▼ (Action: Open Proof Page)
[Proof Page: Doses, Date, Pharmacy, Registry Status]
 │
 ▼ (Decision: Is the dose reported to the registry?)
 ├── Yes ──► [Show Confirmed]
 └── No ──► [Show Pending]
 │
 ▼ (Decision: Does the school or state need a specific form?)
 ├── Yes ──► [Show Form + Signer] ──► (Action: Pharmacist Signs)
 └── No
 │
 ▼ (Action: Send Link or PDF to School Nurse)
 [Share Confirmation]
 │
 ▼ (Decision: Are doses remaining?)
 ├── Yes ──► [Schedule Next-Dose Reminder]
 └── No ──► [Show Series Complete]
```

## User Flow 6: School nurse drive setup and family notification

**Goal.** A school nurse wants more students vaccinated before the deadline, with proof they can trust and without handling each family individually.

**Page migrations.** School Dashboard → Create Drive → Drive Link & QR → Family Notification → Drive Completion Report.

**Entry point.** A school staff account created by invitation (A).

- Step 1: Nurse creates a drive with a date, school and partner pharmacy.
- Decision 1: Has the partner pharmacy accepted the date and capacity? If not, pick another pharmacy or adjust.
- Step 2: The system produces a QR code for the slip and a list of time slots.
- Step 3: Nurse sends the link to families with missing shots using a message template.
- Step 4: After the drive, the nurse sees aggregate counts only.
- Decision 2: Did a family share proof? If yes, show verified status. If not, show "not shared".

```
[School Dashboard]
 │
 ▼ (Action: Create Drive: Date, School, Partner Pharmacy)
[Request Sent to Pharmacy]
 │
 ▼ (Decision: Did the pharmacy accept date and capacity?)
 ├── No ──► [Choose Another Pharmacy or Adjust Date]
 └── Yes ──► [Generate QR Code + Slot List]
 │
 ▼ (Action: Send Link to Families Using Message Template)
 [Drive Day]
 │
 ▼
[Completion Report: Aggregate Counts]
 │
 ▼ (Decision: Did the family share proof?)
 ├── Yes ──► [Show Verified]
 └── No ──► [Show Not Shared]
```

## User Flow 7: MedMe staff campaign review and rules maintenance

**Goal.** A MedMe staff member wants to see whether slip scans turn into completed, reported shots, and keep each state's rules current.

**Page migrations.** Admin Dashboard → Campaign Funnel → Store Comparison → Rules Table → Change Confirmation.

**Entry point.** Admin portal accessed with an authorized staff account.

- Step 1: Staff selects a campaign (state, schools, dates, pharmacies).
- Step 2: Staff views the funnel: scans, profiles, bookings, completed shots, reported shots.
- Decision 1: Is the booking-to-completed rate below the target set for the test? If yes, flag the stores involved.
- Step 3: Staff opens the rules table for a state.
- Decision 2: Has a state rule changed (age floor, prescription, consent, school deadline)? If yes, edit it, add the source link and save. The change is logged.

```
[Admin Dashboard]
 │
 ▼ (Action: Select Campaign)
[Campaign Funnel: Scans > Profiles > Bookings > Completed > Reported]
 │
 ▼ (Decision: Is booking-to-completed below target?)
 ├── Yes ──► [Flag Stores in Store Comparison]
 └── No ──► [Show Normal Status]
 │
 ▼ (Action: Open Rules Table for a State)
[Rules Table]
 │
 ▼ (Decision: Has a rule changed?)
 ├── Yes ──► (Action: Edit Rule + Add Source Link + Save) ──► [Write Audit Log Entry]
 └── No ──► [No Change]
```

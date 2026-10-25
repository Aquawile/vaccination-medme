@AGENTS.md

# Project instructions: MedMe School Vaccines prototype

This file is the authority for this repo. `AGENTS.md` above is Figma Make boilerplate and still holds the Tailwind v4 and code quality rules. Where the two disagree, this file wins. In particular, ignore the line saying a dev server is already running: start it yourself with `pnpm dev`.

Read `docs/prd.md` before any task. Every change should name the work item (for example `W-01`) it belongs to.

## What this is

A click-through prototype that shows MedMe's founder how a parent can find which school-required vaccines a child is missing, book them at a pharmacy, and get proof the school accepts. It runs on fake data in the browser. There is no backend. It is a demo to learn from, not a product.

Three demo roles share one app: parent, pharmacist, administrator (school and campaign admin). Role comes from the signed-in email (see `src/demo/config.ts`).

## Commands

- Install: `pnpm install` (pnpm is the only package manager; `.mise.toml` pins Node 22)
- Dev server: `pnpm dev` (port 8443 by default, `PORT` to change)
- Type check: `pnpm exec tsc --noEmit`
- Build: `pnpm build`
- Browser tests: `pnpm exec playwright test` (needs a running server, defaults to `http://localhost:3000`; set `DEMO_BASE_URL` and `CHROMIUM_PATH` if different; tests never start a server)
- Format: `pnpm format`

**Current pause: do not run any of these commands (dev server, type check, build, tests, formatter) until Isabella says "execute". Write code and tests, commit, and stop. Once she lifts the pause, the rule below applies.**

Before every push run type check, build and the browser tests. All three must pass. At the time of writing `tsc` reports 2 errors in `src/screens/Admin.tsx`; fixing them is work item W-60.

## Branches and safety

- Never commit to or edit `main`. It is read-only for us.
- `staging` is the integration branch. Branch from `staging`, open pull requests into `staging`, and never merge your own pull request.
- Small branches, small pull requests, one work item each. Commit messages: `feat(W-01): short description`.
- Do not force push. Do not rewrite shared history.

## Hard rules for the product

1. Fake data only. No real names, schools, pharmacies, addresses, phone numbers or health records anywhere, including tests and screenshots. Every screen keeps the "Demo data" marker.
2. The parent decides. The app never recommends a vaccine or an age. It can say what a school lists as required and what is missing against that list, and it must show the source and verification status of every rule.
3. Unverified stays labeled. Rules, intervals and requirements that nobody has checked against an official source carry status `unverified` and the UI says so. Never mark something verified without a source URL and a reviewer date.
4. Never invent a state rule. If a state has no researched entry, show "No rules on file, check with the state health department" and block nothing silently.
5. Never show MedMe revenue, fees or pricing logic. Costs shown to a parent are fake sample prices.
6. No AI that gives clinical advice. A drafted message may help with scheduling and confirmation only, a human approves it before it is "sent", and it is labeled as a template unless a real model is behind it.
7. Fake behavior is tagged `// DEMO-FAKE:` in code so a search lists everything to replace in a real build.

## Architecture rules

- Business logic lives in `src/domain/` as pure TypeScript functions with unit tests. No React, no `localStorage`, no `Date.now()` inside them (pass the date in).
- Anything that differs by state, school, store, vaccine or insurer is data in `src/data/*.json` (or `.ts` exporting typed constants), never hard-coded in a component.
- `src/demo/services.ts` is the only place that touches `localStorage` or simulates network calls.
- Screens in `src/screens/` compose components from `src/components/`. Keep a screen file under about 300 lines; split when it grows.
- Shared UI primitives live in `src/components/ui.tsx` (Button, Card, Badge, Field, Select, Alert, Check, Heading, Icon). Add new primitives there (Tabs, Table, Calendar, Modal) instead of styling one-offs inside screens.

## Styling rules

- One theme. All colors, radii, spacing and type come from the CSS variables at the top of `src/index.css`. Do not add raw hex values in CSS or TSX. If a color is missing, add a named variable first.
- Variable names say what the color is for, not what it looks like. `--pink` currently holds a lime color; rename it as part of W-52.
- Use the existing component classes (`.button`, `.card`, `.badge`, `.alert`) and keep the same density, border and radius language across all three roles.
- Mobile first for parent screens (390 px), tablet and desktop for pharmacist and admin. Tap targets 44 px minimum. Keyboard and focus states must keep working; the tests check contrast and keyboard access.
- Brand colors and the MedMe logo are not confirmed. Do not guess hex values from memory. Use the current tokens and a logo placeholder component until the team supplies the real assets.

## Testing rules

- Domain logic: Vitest unit tests next to the code (added in W-60). Include the awkward cases: no record, complete record, dose not yet due, unknown state, child at the exact age boundary.
- User flows: Playwright at mobile, tablet and desktop. When you change a flow, update the matching test in the same pull request.
- Tests must not depend on today's date. Use the app's reference date or an injected date.
- Scale: the roster for demos has hundreds of fake students. Any list you build must stay usable at that size (search, filter, sort, pagination).

## Definition of done

Type check, build and browser tests pass. The demo script in `docs/prd.md` section 9 still runs end to end. New fakes carry `DEMO-FAKE` tags. `docs/prd.md` or `CHANGELOG.md` is updated if behavior changed. The pull request description lists what was tested and anything left faked.

## Files you must not touch

`vite.config.ts`, `.figma/**`, `index.html`, `AGENTS.md`, `.mise.toml`, and anything on `main`. The full file-by-file edit plan and the pull request sequence are in `docs/prd.md` section 12; follow that order unless the team says otherwise.

## When unsure

Ask the team instead of inventing. Items that wait on the MedMe founder or on pharmacists are listed in `docs/prd.md` section 10 and must stay behind a data flag so an answer changes a file, not the code.

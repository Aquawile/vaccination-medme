# Working with more than one agent

Every agent and person works on their own branch cut from `staging`, never on `staging` or `main`. Branch names: `feat/<work-item>-<name>`. One area of the app per agent (for example parent screens, pharmacist screens, admin screens) so merges do not collide.

Before starting: `git fetch --all && git switch -c feat/w-xx-name origin/staging`.
Keeping this clone current: VS Code fetches every 30 seconds (`.vscode/settings.json`), and `bash scripts/sync.sh` runs when the folder opens. It never overwrites uncommitted work.
Finishing: push the branch, open a pull request into `staging`, merge only when the checks are green after saving `backup/staging-<yyyymmdd>-<short sha>`. See `CLAUDE.md`.
Files that belong to one lane: parent (`src/screens/Parent*.tsx`, `Booking.tsx`), pharmacist (`Pharmacist.tsx`), admin (`src/screens/admin/`). Shared files (`src/domain/types.ts`, `src/demo/config.ts`, `src/components/ui.tsx`, `src/index.css`) change in small separate commits, so a conflict stays small.

## Running two agents side by side without conflicts

This folder stays on `staging` and only mirrors GitHub (it updates itself every 30 seconds). Nobody edits here.
Each agent gets its own folder, branch and port with `bash scripts/new-lane.sh <name> <port>`:

| Lane | Folder | Branch | Dev server |
| --- | --- | --- | --- |
| Mirror of staging (read only) | `vaccination-medme` | `staging` | `PORT=8443 pnpm dev` |
| Agent A | `vaccination-medme-<name>` | `feat/<name>` | `PORT=8444 pnpm dev` |
| Agent B | `vaccination-medme-<other>` | `feat/<other>` | `PORT=8445 pnpm dev` |

Unfinished work in one lane never shows up in another, because each folder has its own files and each branch gets its own preview URL on Vercel. When a lane is done and green it merges into `staging`; the other lane then runs `git merge origin/staging` to pick it up.

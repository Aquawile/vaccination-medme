# Working with more than one agent

Every agent and person works on their own branch cut from `staging`, never on `staging` or `main`. Branch names: `feat/<work-item>-<name>`. One area of the app per agent (for example parent screens, pharmacist screens, admin screens) so merges do not collide.

Before starting: `git fetch --all && git switch -c feat/w-xx-name origin/staging`.
Keeping this clone current: VS Code fetches every 30 seconds (`.vscode/settings.json`), and `bash scripts/sync.sh` runs when the folder opens. It never overwrites uncommitted work.
Finishing: push the branch, open a pull request into `staging`, merge only when the checks are green after saving `backup/staging-<yyyymmdd>-<short sha>`. See `CLAUDE.md`.
Files that belong to one lane: parent (`src/screens/Parent*.tsx`, `Booking.tsx`), pharmacist (`Pharmacist.tsx`), admin (`src/screens/admin/`). Shared files (`src/domain/types.ts`, `src/demo/config.ts`, `src/components/ui.tsx`, `src/index.css`) change in small separate commits, so a conflict stays small.

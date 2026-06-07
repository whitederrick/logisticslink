# ForwardLink Chat Handoff - 2026-06-05

## Current Context

- User asked to continue from `docs/WORK_HANDOFF_2026-05-31.md`.
- The MVP flow has been organized into six demo scenes:
  1. Entry control
  2. Cargo demand registration
  3. Blind pool aggregation
  4. Time-lock auction
  5. Award confirmation
  6. Shipment follow-up

## Current Working Changes

- `src/app/page.tsx`
  - Home cards changed from a 4-step flow to the 6 MVP demo scenes.
  - Added entry control and award as separate scenes.
- `src/app/dashboard/page.tsx`
  - Dashboard walkthrough renamed to `MVP demo scenes`.
  - Replaced simple scenario list with scene cards showing actor, workspace, action, and proof.
- `src/components/app-shell.tsx`
  - Core business flow navigation updated to the same 6-scene flow.
- `README.md`
  - Added local launch guidance for Codex/OpenAI desktop launch-link issues.
  - Guidance now uses `scripts\launch-dev.cmd`, not PowerShell.
- `scripts/launch-dev.cmd`
  - Added CMD-based local dev launcher to avoid PowerShell-related crashes.
- `scripts/launch-dev.ps1`
  - Removed from the intended flow because PowerShell can trigger recurring `powershell.exe` application errors in this environment.
- `next-env.d.ts`
  - Reverted generated `.next-dev` reference back to `.next`.

## Verification Already Done

- Before the PowerShell crash concern was raised:
  - TypeScript no-emit check passed.
  - Node test command passed: 17 tests passed.
  - `next build` passed.
- After the PowerShell crash concern:
  - Avoided dev server and PowerShell-heavy verification.
  - Only inspected small diffs and files.

## Important User Constraint

- Do not use PowerShell for background jobs, dev server launch, browser verification, or process orchestration.
- User reported a recurring Windows dialog:
  - `powershell.exe - Application Error`
  - unknown software exception `0xe0434352`
- Treat that as a tool/execution environment issue, not a ForwardLink app code issue.
- Prefer `apply_patch` for edits.
- If execution is necessary, be very conservative and avoid PowerShell-based server/process workflows.

## Next Chat Notes

- User mentioned a previous Cello Square screen, but that screenshot/content is not available in this chat context.
- If Cello Square styling or layout should guide ForwardLink, ask the user to provide the screenshot/URL again in the new chat.

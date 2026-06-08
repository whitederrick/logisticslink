# LogisticsLink Chat Handoff - 2026-06-07

## Current State

- Platform rename from LogisticsLink to LogisticsLink is deployed.
- Active ocean service is named `LogisticsLink Ocean`.
- GitHub repository: `whitederrick/logisticslink`
- Vercel project and production domain: `https://logisticslink.vercel.app`
- Old `logisticslink.vercel.app` domain was removed.
- Production deployment commit `89e31a6` is Ready.
- Production page visually confirmed with LogisticsLink branding and six MVP scenes.

## Infrastructure Completed

- Vercel Git connection points to `whitederrick/logisticslink`.
- Neon PostgreSQL resource `logisticslink-production` is connected only to the
  LogisticsLink Vercel project.
- Neon integration created `DATABASE_URL` and related database variables for
  Production and Preview.
- Vercel variables visible and configured:
  - `DATABASE_URL`
  - `NEXTAUTH_URL`
  - `AUTH_SECRET`
  - `AUTH_COOKIE_SECURE`
  - `ALLOW_CRON_SECRET_QUERY`
  - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`
  - `CRON_SECRET`
- `RATE_BENCHMARK_CSV_SOURCES` is intentionally not configured because real
  SCFI, carrier FAK, and public tariff HTTPS CSV sources are not yet available.
  Do not use placeholder URLs or weaken the source checker.
- Docker Compose project/container names were changed to LogisticsLink.
- Existing physical Docker volume `logisticslink_postgres-data` is preserved to
  prevent local data loss.

## Code and Database State

- Commit `89e31a6 Rebrand platform as LogisticsLink` was pushed to `main`.
- The build command runs:
  - `prisma generate`
  - `prisma migrate deploy`
  - `next build`
- Service boundaries were added through migration
  `20260607090000_add_service_boundaries`.
- A new uncommitted migration exists:
  `prisma/migrations/20260607150000_seed_core_ports/migration.sql`
- It inserts or updates 24 required ocean ports idempotently.
- The new port migration was applied successfully to local PostgreSQL.
- Local SQL verification returned `24` ports.
- Tests passed: 17/17.
- Full production build passed after the new migration.

## Important Pending Work

1. Review and commit `20260607150000_seed_core_ports`.
2. Push `main`; Vercel build will apply the migration to Neon automatically.
3. Confirm the new Vercel deployment is Ready.
4. Verify `https://logisticslink.vercel.app/api/health` returns:
   - `platform: LogisticsLink`
   - `service: logisticslink-ocean`
5. Perform production signup, login, and quote creation QA.
6. Rename local folder last:
   - `C:\myProjects\logisticslink`
   - to `C:\myProjects\logisticslink`
   This must be done after ending the current Codex workspace/thread.

## Operational Constraints

- Work one step at a time when asking the user to navigate a UI.
- Avoid PowerShell background jobs, `Start-Job`, and `Start-Process`.
- Use `scripts\launch-dev.cmd` for local development.
- Direct foreground commands are acceptable.
- After `next build`, restart any running local dev server before trusting
  localhost errors.
- Do not expose Neon database credentials in screenshots or chat.

## Restart Point

Start the new chat by reading this file. The immediate action is to commit and
push the uncommitted core-port migration, then verify its Vercel deployment.

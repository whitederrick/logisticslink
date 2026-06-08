# LogisticsLink Platform Architecture

## Naming Model

- Platform brand: `LogisticsLink`
- Active service: `LogisticsLink Ocean`
- Stable service code: `logisticslink-ocean`
- Planned service families: air, inland transport, warehousing

Customer-facing platform copy must use `LogisticsLink`. Ocean co-buying, time-lock, carrier auction, award, and shipment follow-up copy must use `LogisticsLink Ocean`.

`src/lib/product.ts` is the single source for platform and service catalog names. Do not scatter new brand literals through UI components.

## Domain Boundary

The current Prisma `Quote`, `CoBuyPool`, `PoolParticipant`, and `AuctionBid` models belong to LogisticsLink Ocean. `Quote.serviceCode` and `CoBuyPool.serviceCode` make that ownership explicit and must be included in list, count, matching, batch, and mutation boundaries.

Future services should not force their data into the ocean model:

- Air may share account, access, notification, and audit infrastructure, but should add air-specific shipment and rate models.
- Inland transport should model locations, equipment, legs, dispatch, and proof of delivery separately.
- Warehousing should model facilities, capacity, inventory handling, and fulfillment separately.
- Cross-service views may aggregate read models, but service modules retain their own write rules.

## Shared Platform Capabilities

These concerns are platform-level and may be reused by every service:

- Company accounts, roles, approval, restriction, and authentication
- Notifications and audit logs
- Language and shared application shell
- Service catalog and service routing
- Deployment health and environment validation

Ocean rate benchmarks remain service-specific until a normalized multi-mode rate contract is designed.

## Compatibility Rules

- Keep PostgreSQL database and user names aligned with the deployed environment unless an infrastructure migration is separately scheduled.
- Keep the physical Docker volume name `logisticslink_postgres-data` and mount it from the `logisticslink` Compose project so local PostgreSQL data is preserved.
- Keep historical Prisma migrations immutable.
- Keep local/rehearsal scenario emails and `LogisticsLink!123` until scenario credentials are deliberately rotated.
- Use `logisticslink_session` for new sessions.
- Read `logisticslink_legacy_session` during the transition and delete both names on logout.
- Redirect previously published domains and repository URLs only after the new deployment is verified.

## Expansion Checklist

Before activating a new service:

1. Add it to `src/lib/product.ts` with a stable code.
2. Define its own domain models and migrations.
3. Scope every query, mutation, batch, and audit view to its service code.
4. Add role permissions without changing existing Ocean permissions.
5. Add service-specific navigation and an end-to-end operating scenario.
6. Run tests, Prisma generation, production build, and deployment preflight checks.

## Deferred Infrastructure Rename

The repository folder, Git remote, Vercel project, database identifiers, and production domain are operational resources. Rename them only as a coordinated deployment task. A brand release does not require a destructive database rename.

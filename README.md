# ForwardLink

ForwardLink is a co-buying digital forwarding platform for aggregating shipper and forwarder demand into blind freight pools, then opening carrier reverse auctions.

## Development

```powershell
npm install
copy .env.example .env
npm run db:up
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

The local web app runs at `http://localhost:3001`.

The default database is PostgreSQL. The local Docker database uses the same
credentials as `.env.example`:

```text
postgresql://forwardlink:forwardlink@localhost:5433/forwardlink?schema=public
```

Useful database commands:

- `npm run db:up` starts local PostgreSQL.
- `npm run db:down` stops local PostgreSQL while keeping data.
- `npm run db:reset` removes local PostgreSQL data and starts a fresh database.
- `npm run prisma:migrate -- --name <migration-name>` creates and applies a migration.
- `npm run seed` loads the demo ports and users.

Docker Desktop must be running before `npm run db:up`.

Recommended local stack:

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS

The product PRD lives in `docs/ForwardLink_Development_PRD.md`.

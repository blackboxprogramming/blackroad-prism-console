# DB (Prisma + SQLite)
- URL: `DATABASE_URL=file:./blackroad.db`
- Migrate in dev: `npm run migrate:dev --prefix apps/api`
- Deploy migrations: `npm run migrate --prefix apps/api`
- Client: `import { prisma } from 'apps/api/src/lib/db'`

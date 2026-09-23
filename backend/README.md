This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

> **Note**: Bridges backend server runs on **port 3001** (`http://localhost:3001`). Port 3000 is intentionally reserved/avoided to prevent port collisions.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database Management (Prisma)

Ensure your `.env` contains a valid `DATABASE_URL` before running database commands.

### Schema Sync & Prototyping (Fast Iteration)

Best for active development and cloud-hosted/pooled databases (e.g. Prisma Postgres, Supabase, Neon) without needing shadow databases:

```bash
# Push schema changes directly to the database and regenerate client
yarn db:push
# or: npm run db:push

# Force reset the database and push new schema (deletes all data)
yarn db:push:reset
# or: npm run db:push:reset
```

### Migrations (Version Controlled)

Use when creating tracked, version-controlled migration files in `prisma/migrations/`:

```bash
# Create and apply a new migration locally
yarn db:migrate
# or: npm run db:migrate -- --name <migration_name>

# Create migration SQL file only (without applying immediately)
yarn db:migrate:create
# or: npm run db:migrate:create -- --name <migration_name>

# Apply pending migrations to production/staging (CI/CD or production server)
yarn db:migrate:deploy
# or: npm run db:migrate:deploy

# Check migration status and pending migrations
yarn db:migrate:status
# or: npm run db:migrate:status
```

### Client Generation & Seeding

```bash
# Regenerate Prisma Client (@prisma/client)
yarn db:generate
# or: npm run db:generate

# Seed the database with initial/mock data (prisma/seed.ts)
yarn db:seed
# or: npm run db:seed
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

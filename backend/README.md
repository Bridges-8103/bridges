# Backend Service (Next.js + Prisma)

This is the backend service for Bridges, built with Next.js App Router, Prisma ORM, and PostgreSQL via `@prisma/adapter-pg`.

---

## 🗄️ Database & Prisma Setup

### Environment Variables
Ensure `DATABASE_URL` is configured in your `.env` file (refer to `.env.example`):
```bash
DATABASE_URL="postgres://user:password@pooled.db.prisma.io:5432/postgres?sslmode=require"
```

### Database Scripts
| Command | Description |
| --- | --- |
| `npm run db:migrate` | Create and apply database migrations (`npx prisma migrate dev`) |
| `npm run db:generate` | Generate Prisma Client (`npx prisma generate`) |
| `npm run db:deploy` | Apply pending migrations in production / CI (`npx prisma migrate deploy`) |
| `npm run db:seed` | Seed the database with sample data (`npx prisma db seed`) |
| `npm run db:studio` | Launch Prisma Studio GUI (`npx prisma studio`) |

---

## 🏗️ Architecture & Scalable Project Structure

To ensure the backend scales cleanly as domain logic grows, code is structured into modular layers:

```
backend/
├── prisma.config.ts         # Prisma configuration (schema, migrations, datasource)
├── prisma/
│   ├── schema.prisma        # Prisma models and database schema
│   ├── migrations/          # Version-controlled database migrations
│   └── seed.ts              # Database seeding script
├── src/
│   ├── app/
│   │   ├── api/             # API Route Handlers (HTTP layer)
│   │   │   ├── health/      # Health check verifying database connection
│   │   │   ├── users/       # Users API endpoints (GET, POST)
│   │   │   └── posts/       # Posts API endpoints (GET, POST)
│   ├── generated/
│   │   └── prisma/          # Generated Prisma Client artifacts
│   ├── lib/
│   │   └── prisma.ts        # Prisma Client singleton with connection pooling
│   ├── modules/             # Domain logic (Business / Service layer)
│   │   ├── users/           # User service, repository, and types
│   │   └── posts/           # Post service, repository, and types
│   └── server/
│       └── db.ts            # Server-side database re-exports & helpers
```

### Layer Responsibilities
1. **HTTP Layer (`src/app/api/`)**:
   - Handles request parsing, query parameters, input validation, and HTTP status responses.
   - Delegates business logic to module services.
2. **Service Layer (`src/modules/*/*.service.ts`)**:
   - Contains business logic, query composition, transactions, and data transformations.
   - Decoupled from Next.js HTTP primitives for easy unit testing or reuse across server actions / background jobs.
3. **Database Client (`src/lib/prisma.ts`)**:
   - Manages the singleton `PrismaClient` with `@prisma/adapter-pg` driver adapter.
   - Prevents multiple connection pool instances during Next.js Turbopack / Fast Refresh.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

The server runs on [http://localhost:3000](http://localhost:3000).
- Health check: `http://localhost:3000/api/health`
- Users endpoint: `http://localhost:3000/api/users`
- Posts endpoint: `http://localhost:3000/api/posts`

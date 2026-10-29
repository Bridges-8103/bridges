# Bridges

Bridges is an academic mentorship platform connecting university students with faculty researchers and mentors. Students can explore research topics, find faculty members by expertise, book 1-on-1 mentorship sessions, and chat in real-time.

---

## What We Did (High Level)

1. **Cross-Platform Mobile App (`app/`)**
   - Built a mobile app for iOS and Android using React Native and Expo.
   - Features mentor discovery, research area filtering, session slot booking, in-app messaging, and push notifications for upcoming meetings.

2. **Backend API & Admin Portal (`backend/`)**
   - Built a unified Next.js backend providing REST endpoints for the mobile app alongside an admin dashboard.
   - Integrated Clerk authentication with custom role-based access control (Student, Mentor, Admin).
   - Designed PostgreSQL data models with Prisma ORM for slot reservations, session states, user reporting, and push token management.

3. **Academic Crawler & Seeder (`crawler/`)**
   - Built a crawler to ingest real researcher profiles, bios, and research areas from the University of Adelaide directory.
   - Populated the database with realistic seed data to bootstrap the platform with genuine academic contexts.

---

## Tech Stack

- **Mobile App**: React Native, Expo (SDK 52+), Expo Router, TanStack Query, Clerk (`@clerk/expo`)
- **Backend & Admin Web**: Next.js (App Router), TypeScript, Tailwind CSS
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: Clerk (JWT verification via Edge middleware & API guards)
- **Notifications**: Expo Server SDK
- **Data Scraping**: TypeScript, Cheerio

---

## Repository Structure

```text
bridges/
├── app/        # Expo / React Native mobile application
├── backend/    # Next.js API, Prisma schema & Admin dashboard
├── crawler/    # Researcher directory scraper & database seeder
└── docs/       # Architecture diagrams and technical documentation
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A PostgreSQL database instance (local or hosted, e.g. Neon, Supabase, Prisma Postgres)
- A [Clerk](https://clerk.com/) account for authentication keys

---

### 1. Run the Backend

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Fill in `backend/.env` with your database URL and Clerk credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bridges"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
PORT=3001
```

Apply database migrations/schema and run the server:

```bash
# Push Prisma schema to the database
npm run db:push

# (Optional) Seed initial test accounts and sample data
npm run db:seed

# Start dev server (runs on http://localhost:3001)
npm run dev
```

> **Note**: The backend runs on port **3001** (`http://localhost:3001`) to avoid standard port 3000 conflicts.

---

### 2. Run the Mobile App

In a separate terminal window:

```bash
cd app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Configure `app/.env`:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_API_URL=http://localhost:3001
```

> **Testing on a physical device**: Change `http://localhost:3001` to your computer's local IP address (e.g. `http://192.168.1.50:3001`).

Start Expo:

```bash
npm run start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with the **Expo Go** app on your phone.

---

### 3. (Optional) Run the Crawler & Seed Mentors

To crawl researcher profiles and push them into the database:

```bash
cd crawler
npm install
npm run crawl:test    # Crawl a small sample batch
npm run seed:backend  # Seed the crawled records into PostgreSQL
```

# Agent Guidelines: Scalable Next.js Architecture

These guidelines define the architectural standards, code organization, and development practices for Next.js applications in this repository. All agents and contributors must adhere to these conventions.

---

## 1. Project Folder Structure

Follow a strict, modular directory layout under `src/` to ensure maintainability, clear ownership, and rapid navigation:

```
src/
├── app/                 # Next.js App Router (pages, layouts, route handlers)
│   └── api/             # API Route Handlers (/api/[resource]/route.ts)
├── components/          # Categorized React components
│   ├── ui/              # Primitive building blocks (Button, Input, Select, Toggle)
│   ├── layout/          # Structural layout components (Header, Footer, Navbar, Shell)
│   ├── pages/           # Page-specific components (HomePageHero, ProductCard)
│   └── common/          # Global shared components (Modal, Tooltip, Loader, Toast)
├── lib/                 # Business logic, external API clients, DB connectors, auth handlers
├── hooks/               # Custom React hooks (e.g., useAuth, useDebounce)
├── api/                 # External API client services and SDK integrations
├── stores/              # Client state management (Zustand stores)
└── utils/               # Generic, pure helper functions (formatting, calculations)
```

### Organization & Naming Rules
- **Semantic & Self-Descriptive**: Directories and files must clearly communicate their role (e.g., `ProductCard`, `useAuth`, `formatDate`).
- **Casing Conventions**:
  - `PascalCase` for React components (`Button.tsx`, `HomePageHero.tsx`).
  - `camelCase` for utilities, helper functions, and custom hooks (`formatDate.ts`, `useAuth.ts`).
  - `kebab-case` or lowercase standard Next.js conventions for route segments and special route files (`route.ts`, `page.tsx`, `layout.tsx`).
- **Think Ahead**: Do not create arbitrary top-level folders; evaluate how additions scale before introducing new categories.

---

## 2. Component Organization & Architecture

Group components by intent and reuse level rather than maintaining a flat component folder:

| Category | Path | Responsibility & Rules | Examples |
| :--- | :--- | :--- | :--- |
| **UI Primitives** | `components/ui/` | Lowest-level, atomic building blocks. Highly reusable, styling-focused, agnostic of business domain. | `Button`, `Input`, `Select`, `Toggle`, `Badge` |
| **Layout Components** | `components/layout/` | Structural page scaffolding reused across routes and layouts. | `Header`, `Footer`, `Sidebar`, `Navbar`, `Container` |
| **Page-Specific** | `components/pages/` | Components tied explicitly to a single page or distinct domain view. Not shared globally. | `HomePageHero`, `ProductDetailsCard`, `CheckoutSummary` |
| **Common Reusable** | `components/common/` | Domain-agnostic utility widgets and feedback elements usable anywhere. | `Modal`, `ConfirmDialog`, `Loader`, `Tooltip`, `Notification` |

### Component Design Principles
- **Variations via Props over Duplication**: Do not create separate components for variants (e.g., avoid `DangerButton.tsx` vs `PrimaryButton.tsx`). Instead, use a single flexible component that accepts a `variant` prop:
  ```tsx
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
  <Button variant="danger">Delete</Button>
  ```
- **Separation of Concerns**: Keep UI primitives free from direct network calls or global store coupling. Pass data or callbacks via props.

---

## 3. API Route Structure & Best Practices

Organize Next.js App Router API handlers (`src/app/api/`) hierarchically:

```
src/app/api/
├── products/
│   ├── route.ts             # Collection handler (GET /api/products, POST /api/products)
│   └── [id]/
│       └── route.ts        # Item handler (GET /api/products/[id], PATCH, DELETE)
├── orders/
│   ├── route.ts
│   └── [id]/route.ts
└── users/
    ├── route.ts
    └── [id]/route.ts
```

### API Implementation Standards
1. **Predictable & Consistent Response Formatting**:
   Always format API responses using a standardized helper (e.g., `sendResponse`):
   ```ts
   // lib/sendResponse.ts
   export function sendResponse<T>(status: number, data: T | null = null, message = '') {
     return Response.json({ status, data, message }, { status });
   }
   ```
2. **Strict Input Validation (Zod)**:
   Validate and sanitize all request bodies, query params, and headers using Zod schemas before processing:
   ```ts
   import { z } from 'zod';

   export const productSchema = z.object({
     name: z.string().min(1, "Name is required"),
     price: z.number().positive(),
     description: z.string().optional(),
   });

   // Inside route handler
   const body = await req.json();
   const result = productSchema.safeParse(body);
   if (!result.success) {
     return sendResponse(400, null, result.error.format());
   }
   ```
3. **Centralized Middleware & Authentication Pipeline (Two-Tier Architecture)**:
   - **Tier 1 (Edge Proxy / Middleware `src/proxy.ts` or `src/middleware.ts`)**:
     - Runs at the edge before route handlers.
     - Handles CORS preflight (`OPTIONS`) with permissive headers for mobile apps (Expo) and web clients.
     - Whitelists public paths (`/api/health`, `/api/auth/login`, etc.).
     - Intercepts protected requests, verifies `Authorization: Bearer <token>` or session cookies using Edge-compatible Web Crypto (`crypto.subtle`), and injects verified user headers (`x-user-id`, `x-user-email`, `x-user-role`).
   - **Tier 2 (Route Handler Auth Guard `withAuth`)**:
     - Route handlers wrap protected endpoints with `withAuth(async (req, { user, params }) => ...)`.
     - Automatically verifies role-based access control (RBAC) and exposes typed `user: AuthUser` to the handler.
   ```ts
   // Example: Protected API Route
   export const GET = withAuth(async (req, { user }) => {
     const profile = await ProfileService.getProfileByUserId(user.id);
     return sendResponse(200, profile);
   });
   ```
4. **Descriptive Error Handling**:
   Never fail silently or return raw stack traces. Catch exceptions and return appropriate HTTP status codes (400, 401, 403, 404, 500) with informative messages:
   ```ts
   try {
     const product = await getProductById(params.id);
     if (!product) {
       return sendResponse(404, null, "Product not found.");
     }
     return sendResponse(200, product);
   } catch (error) {
     return sendResponse(500, null, "Internal server error.");
   }
   ```

---

## 4. Separation of Helpers: `utils/` vs `lib/`

Maintain a strict boundary between general utilities and domain/infrastructure libraries:

| Aspect | `src/utils/` | `src/lib/` |
| :--- | :--- | :--- |
| **Definition** | Pure, small, general-purpose utility functions. | Substantial modules tied to business logic or external systems. |
| **Dependencies** | No external business dependencies, stateless, pure input/output. | Database clients, API clients, authentication handlers, external SDKs. |
| **Examples** | `formatDate(date)`, `calculateDiscount(price, pct)`, `slugify(str)`, `capitalize(str)` | `apiClient.ts`, `auth.ts`, `prisma.ts` / `db.ts`, `stripe.ts` |

### Rules for Utilities
- **Single Responsibility**: Each utility must perform one task cleanly.
- **No Business Logic**: Do not embed business rules or domain assumptions in `utils/`.
- **Periodic Audits**: Remove redundant or obsolete helpers rather than allowing dead code to accumulate.

---

## 5. Performance & Scalability from Day One

### Dynamic Imports & Lazy Loading
- Use `next/dynamic` to defer loading heavy components, large client libraries, or charts until needed:
  ```tsx
  import dynamic from 'next/dynamic';

  const DynamicChart = dynamic(() => import('@/components/ui/Chart'), {
    loading: () => <p>Loading chart...</p>,
    ssr: false,
  });
  ```

### Scalable State Management & Data Fetching (TanStack Query)
- **MANDATORY for App / Client Data Fetching**: Always use **TanStack Query (`@tanstack/react-query`)** for all server state fetching, caching, synchronization, and mutations in client and mobile code (`app/`).
- **NO Raw `useEffect` Fetching**: Never use `useEffect` + manual `useState` (`data`, `isLoading`, `error`) to fetch remote server data.
- **Client Stores for Client State Only**: Prefer lightweight stores such as **Zustand** (or Context) strictly for client-only UI state (e.g. modals, transient form inputs, theme). Never duplicate or store server cache in client stores.
- **Services Architecture (`src/services/<entity>/`)**: In `app/`, organize all API calls, query keys, and hooks into `services/<entity>/` (`types.ts`, `keys.ts`, `api.ts`, `queries.ts`, `mutations.ts`, `index.ts`). See `app/AGENTS.md` for full blueprint.
- Isolate state stores under `src/stores/` (e.g., `stores/authStore.ts`, `stores/cartStore.ts`).
- Avoid storing server cache data in client stores; use React Server Components and Next.js caching on the backend, and TanStack Query on the app side.

### Incremental Static Regeneration (ISR) & Caching
- Use Next.js ISR (`export const revalidate = <seconds>`) for content-heavy pages to combine the speed of static delivery with periodic data freshness:
  ```tsx
  export const revalidate = 60; // Revalidate every 60 seconds

  export default async function ProductsPage() {
    const products = await fetchProducts();
    return <ProductList products={products} />;
  }
  ```

### Edge Middleware for Route Protection
- Intercept unauthorized requests at the edge before hitting server render or route handlers:
  ```ts
  // middleware.ts
  import { NextResponse, type NextRequest } from 'next/server';

  export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    if (pathname.startsWith('/dashboard')) {
      const token = req.cookies.get('token');
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
    return NextResponse.next();
  }
  ```

---

## 6. Architecture Anti-Patterns to Avoid

- ❌ **Unstructured Flat Component Folders**: Dumping all components into a single folder without separation into UI, layout, common, and pages.
- ❌ **Duplicated Variant Components**: Creating multiple files for cosmetic variants instead of using props.
- ❌ **Inconsistent API Payloads**: Returning raw data in some routes and `{ data, status }` in others.
- ❌ **Blurring `utils/` and `lib/`**: Placing database queries or API fetchers into `utils/`, or pure string formatters into `lib/`.
- ❌ **Excessive Prop Drilling**: Passing callbacks and state through numerous component layers instead of using Zustand stores or component composition.
- ❌ **Bloated Initial Bundles**: Importing heavy third-party visualization or editor components statically on main landing pages without dynamic imports.
- ❌ **Manual Remote State in `useEffect`**: Hand-rolling `useState` + `useEffect` fetchers instead of using TanStack Query (`@tanstack/react-query`).
- ❌ **Server Cache in Client Stores**: Duplicating or managing API response caches inside Zustand or React Context instead of TanStack Query.

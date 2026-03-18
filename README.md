# Tasks

A personal task management PWA built with Next.js, Drizzle ORM, and Neon PostgreSQL. Features a dark-first design, command palette, push notifications, auto-archiving, and full mobile support.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06b6d4)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169e1)

## Features

- **Task Management** — Create, edit, delete, archive, and restore tasks with status, priority, label, and due date fields
- **Desktop Table View** — Sortable, filterable data table with row expansion, multi-select, and bulk actions via TanStack React Table
- **Mobile Layout** — Bottom navigation with swipeable drawer for task details, mobile-optimized create form
- **Command Palette** — `Cmd+K` / `Ctrl+K` to search tasks, change status/priority, toggle theme, and navigate
- **Auto-Archive** — Tasks marked as done or cancelled are automatically archived after 24 hours
- **Archive Sheet** — Side sheet to browse, restore, or permanently delete archived tasks
- **Push Notifications** — Daily digest at 8:30 AM IST for due and overdue tasks via Web Push
- **PWA** — Installable progressive web app with offline support via Serwist service worker
- **Dark/Light Theme** — System-aware with manual toggle (press `D` to switch)
- **Single-User Auth** — Password-protected with iron-session (30-day cookie)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org) (strict mode) |
| Database | [Neon](https://neon.tech) (serverless PostgreSQL) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| UI Components | [shadcn/ui](https://ui.shadcn.com) (Radix primitives) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Auth | [iron-session](https://github.com/vvo/iron-session) |
| Data Table | [TanStack React Table](https://tanstack.com/table) |
| Animations | [Framer Motion](https://motion.dev) |
| PWA | [Serwist](https://serwist.pages.dev) |
| Push | [web-push](https://github.com/web-push-libs/web-push) |
| Hosting | [Vercel](https://vercel.com) (free tier) |

## Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 10
- A [Neon](https://neon.tech) PostgreSQL database (free tier)
- A [Vercel](https://vercel.com) account for deployment (free tier)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ravi2k3/todo.git
cd todo/todo
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Database — Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Auth — bcrypt hash of your password
AUTH_PASSWORD_HASH=$2b$12$...

# Session — random 64-char hex string for cookie encryption
SESSION_SECRET=your-64-char-hex-string

# Push Notifications — VAPID key pair
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Cron Auth — random secret for Vercel Cron (required in production)
CRON_SECRET=your-random-secret
```

#### Generating values

**Password hash** (replace `your-password` with the password you want):

```bash
node -e "require('bcryptjs').hash('your-password', 12).then(h => console.log(h))"
```

**Session secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**VAPID keys:**

```bash
npx web-push generate-vapid-keys
```

**Cron secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Push the database schema

```bash
pnpm db:push
```

This creates the `tasks` and `push_subscriptions` tables in your Neon database.

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your password.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build (webpack, required by Serwist) |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |

## Project Structure

```
├── app/
│   ├── layout.tsx                 # Root layout (fonts, theme, toaster)
│   ├── page.tsx                   # Main tasks page (server component)
│   ├── manifest.ts                # PWA web manifest
│   ├── sw.ts                      # Service worker (Serwist + push handlers)
│   ├── globals.css                # Tailwind theme (light/dark CSS variables)
│   ├── login/
│   │   └── page.tsx               # Password login page
│   └── api/
│       └── cron/
│           └── notify/
│               └── route.ts       # Daily push notification cron endpoint
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   ├── header.tsx                 # Top bar (theme, archive, notifications, logout)
│   ├── task-table.tsx             # Desktop data table with tabs
│   ├── task-table-columns.tsx     # Column definitions
│   ├── task-table-toolbar.tsx     # Search and filter bar
│   ├── task-table-faceted-filter.tsx  # Multi-select faceted filters
│   ├── task-row-actions.tsx       # Row context menu
│   ├── task-expanded-row.tsx      # Expanded row detail view
│   ├── task-create-dialog.tsx     # Create task dialog (desktop)
│   ├── task-create-mobile.tsx     # Create task drawer (mobile)
│   ├── task-mobile-layout.tsx     # Mobile view with bottom nav
│   ├── task-mobile-list.tsx       # Mobile task list
│   ├── task-status-icon.tsx       # Status indicator icon
│   ├── task-priority-icon.tsx     # Priority indicator icon
│   ├── archive-sheet.tsx          # Archive side sheet
│   ├── command-menu.tsx           # Cmd+K command palette
│   ├── notification-toggle.tsx    # Push notification popover
│   ├── page-transition.tsx        # Page enter animation
│   ├── theme-provider.tsx         # Dark/light theme provider
│   └── sw-register.tsx            # Service worker registration
├── lib/
│   ├── env.ts                     # Environment variable accessors
│   ├── push.ts                    # Shared web-push VAPID config
│   ├── utils.ts                   # cn() utility
│   ├── types.ts                   # Task types and config maps
│   ├── db/
│   │   ├── index.ts               # Neon database client
│   │   └── schema.ts              # Drizzle table definitions
│   ├── auth/
│   │   ├── session.ts             # iron-session config
│   │   └── actions.ts             # Login/logout server actions
│   └── actions/
│       ├── tasks.ts               # Task CRUD server actions
│       └── notifications.ts       # Push subscription server actions
├── middleware.ts                   # Auth middleware (session check)
├── vercel.json                    # Vercel cron configuration
├── drizzle.config.ts              # Drizzle Kit config
└── next.config.mjs                # Next.js + Serwist config
```

## Database Schema

### `tasks`

| Column | Type | Description |
|---|---|---|
| `id` | `serial` | Primary key |
| `title` | `text` | Task title (required) |
| `description` | `text` | Optional description |
| `status` | `text` | `todo` · `in_progress` · `done` · `cancelled` |
| `priority` | `text` | `low` · `medium` · `high` |
| `label` | `text` | `bug` · `feature` · `docs` · `personal` · `infra` |
| `due_at` | `timestamptz` | Optional due date |
| `created_at` | `timestamptz` | Auto-set on creation |
| `updated_at` | `timestamptz` | Auto-set on creation, updated on changes |
| `archived_at` | `timestamptz` | Set when archived, null when active |

### `push_subscriptions`

| Column | Type | Description |
|---|---|---|
| `id` | `serial` | Primary key |
| `endpoint` | `text` | Push service endpoint URL (unique index) |
| `p256dh` | `text` | Client public key |
| `auth` | `text` | Client auth secret |
| `created_at` | `timestamptz` | Auto-set on creation |

## Deployment

### Vercel

1. Push the repo to GitHub.

2. Import the project on [vercel.com/new](https://vercel.com/new).

3. Set the **Root Directory** to `todo` (the inner folder).

4. Add all environment variables from `.env.local` to the Vercel project settings:
   - `DATABASE_URL`
   - `AUTH_PASSWORD_HASH`
   - `SESSION_SECRET`
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `CRON_SECRET`

5. Deploy. The cron job (`/api/cron/notify`) runs daily at 3:00 AM UTC (8:30 AM IST) as configured in `vercel.json`.

### Push Notifications

Push notifications work automatically once deployed:

1. Open the app and click the bell icon in the header.
2. Click **Enable notifications** and allow the browser permission prompt.
3. The daily cron sends a digest of due and overdue tasks to all subscribed devices.

Stale subscriptions (e.g., uninstalled browsers) are automatically cleaned up.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `D` | Toggle dark/light theme |

## License

Private project.

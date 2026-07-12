# AssetFlow

> **Enterprise Asset & Resource Management System** — Odoo Hackathon 2026

AssetFlow is a full-stack ERP module for tracking, allocating, and maintaining physical assets and shared resources across any organization — offices, schools, hospitals, factories, or agencies. It replaces spreadsheets and paper logs with structured asset lifecycles, conflict-safe allocation, overlap-validated booking, gated maintenance workflows, and auditable cycle-based physical verification.

**Not in scope:** purchasing, invoicing, accounting, payroll.

---

## Features

| Module | What it does |
|---|---|
| 🔐 **Auth & Roles** | JWT-based sign-in, Employee-only self-registration, Admin-controlled role promotion |
| 🏢 **Org Setup** | Department hierarchy, asset categories with custom fields, employee directory |
| 📦 **Asset Registry** | Auto-tagged (`AF-0001`…), searchable by tag/serial/QR/category/status/location |
| 🔄 **Allocation & Transfer** | Conflict-safe allocation, Transfer Request flow, overdue auto-flagging, return with condition notes |
| 📅 **Resource Booking** | Per-resource calendar, overlap rejection, back-to-back allowed, reschedule/cancel |
| 🔧 **Maintenance** | Employee raises → Manager approves → Technician assigned → Resolved; asset status auto-syncs |
| 🔍 **Audit Cycles** | Create cycle, assign auditors, mark Verified/Missing/Damaged, close cycle (Missing → Lost) |
| 📊 **Reports** | Utilization trends, maintenance frequency, retirement schedule, dept allocation, booking heatmap, CSV export |
| 🔔 **Notifications** | Real-time feed for assignments, approvals, overdue alerts, booking confirmations |
| 📋 **Activity Log** | Full searchable audit trail of every user action |

---

## Tech Stack

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL via Prisma ORM (migrations + seed)
- JWT authentication · bcrypt passwords · Zod validation
- node-cron for overdue detection

**Frontend**
- React 18 + TypeScript + Vite
- React Router v6, TanStack Query, Axios
- Tailwind CSS v3 with a locked design system (CSS custom properties, 4px spacing scale, Inter + IBM Plex Mono typefaces)
- Recharts for analytics visualizations

**Monorepo** — npm workspaces (`client/` + `server/`)

---

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14 running locally (or a cloud connection string)

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/parth-soni67/AssestFlow-odoo-hackathon-2026-.git
cd AssestFlow-odoo-hackathon-2026-

# 2. Install all dependencies (runs in both workspaces)
npm install

# 3. Configure the database
cp server/.env.example server/.env
# Edit server/.env — set DATABASE_URL and JWT_SECRET
```

**`server/.env` minimum config:**
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/assetflow"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

```bash
# 4. Run migrations and seed the database
cd server
npx prisma migrate dev
npm run db:seed

# 5. Start both servers (from repo root)
cd ..
npm run dev
```

- **API:** http://localhost:3000
- **App:** http://localhost:3001

---

## Demo Accounts

All seeded accounts use the password **`password123`**.

| Role | Email | Access |
|---|---|---|
| Admin | `admin@assetflow.dev` | Full access — departments, categories, role promotion, all reports |
| Asset Manager | `manager@assetflow.dev` | Register assets, approve allocations/transfers/maintenance/audits |
| Asset Manager | `manager2@assetflow.dev` | Second manager account for transfer approval demos |
| Department Head (IT) | `head@assetflow.dev` | IT department assets, book resources, approve dept transfers |
| Department Head (HR) | `hrhead@assetflow.dev` | HR department assets |
| Department Head (Facilities) | `fachead@assetflow.dev` | Facilities department assets |
| Employee | `employee@assetflow.dev` | Own assets, raise maintenance, book resources, initiate returns |

---

## Demo Script (for judges)

Follow this sequence to exercise every major workflow in under 10 minutes.

**1. Role enforcement**
> Sign up at `/signup` using any email — confirm you land as `Employee`, with no role selector visible.

**2. Role promotion (Admin)**
> Log in as `admin@assetflow.dev` → Org Setup → Employee Directory → promote the new signup to `Department Head`.

**3. Asset registration (Asset Manager)**
> Log in as `manager@assetflow.dev` → Assets → Register Asset → fill name/category/location → confirm auto-tag `AF-00XX` and status `Available`.

**4. Allocation conflict guard**
> Allocate the asset to `employee@assetflow.dev` — it flips to `Allocated`.
> Try allocating the same asset to a second employee — the system blocks it, shows the current holder, and offers a Transfer Request button.

**5. Transfer flow**
> Submit the Transfer Request. Log back in as Asset Manager → Maintenance → approve the transfer → confirm asset moves to new holder and history updates automatically.

**6. Booking overlap validation**
> Log in as any employee → Bookings → select a bookable resource → book 09:00–10:00.
> Attempt 09:30–10:30 on the same resource → **rejected (overlap)**.
> Book 10:00–11:00 → **accepted** (back-to-back is allowed).

**7. Maintenance workflow**
> Employee raises a maintenance request on any allocated asset.
> Asset Manager approves it → asset flips to `UnderMaintenance`.
> Manager marks Resolved → asset flips back to `Available`.

**8. Audit cycle**
> Admin creates an Audit Cycle with scope = IT Department.
> Auditor marks one asset `Missing`, closes the cycle → that asset's status becomes `Lost`.

**9. Dashboard & notifications**
> Return to Dashboard — KPIs reflect all the above changes in real time.
> Open the notification bell — see assignments, approvals, overdue alerts from every action above.

**10. Reports**
> Reports → Asset Utilization: most-used assets, idle assets.
> Reports → Booking Heatmap: peak reservation hours visualized as a grid.
> Click any "Export CSV" button — downloads a clean spreadsheet.

---

## Project Structure

```
AssestFlow-odoo-hackathon-2026-/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Shared: Layout, StatusBadge, KpiCard
│   │   ├── modules/          # Feature screens (auth, dashboard, assets, …)
│   │   ├── lib/              # API client, AuthContext
│   │   └── index.css         # Design token root variables
│   └── tailwind.config.js
│
├── server/                   # Express + Prisma backend
│   ├── src/
│   │   ├── routes/           # REST endpoints (/api/v1/*)
│   │   ├── middleware/        # Auth guard, error handler
│   │   └── db/               # Prisma schema + seed
│   └── prisma/
│       └── schema.prisma
│
└── package.json              # npm workspaces root
```

---

## API Reference

All endpoints are prefixed `/api/v1`. Authentication via `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Sign in, returns JWT |
| `POST` | `/auth/signup` | Register (Employee role only) |
| `GET` | `/assets` | List assets with filters |
| `POST` | `/assets` | Register new asset |
| `GET` | `/assets/:id` | Asset detail with allocation + maintenance history |
| `POST` | `/allocations` | Allocate asset to employee/department |
| `POST` | `/allocations/:id/return` | Return asset with condition notes |
| `GET` | `/bookings` | List bookings for a resource |
| `POST` | `/bookings` | Create booking (overlap-validated) |
| `GET` | `/maintenance` | List maintenance requests |
| `POST` | `/maintenance` | Raise maintenance request |
| `PATCH` | `/maintenance/:id/status` | Update maintenance status |
| `GET` | `/audits` | List audit cycles |
| `POST` | `/audits` | Create audit cycle |
| `POST` | `/audits/:id/close` | Close cycle (transactional status updates) |
| `GET` | `/reports/utilization` | Asset utilization summary |
| `GET` | `/reports/maintenance` | Maintenance frequency breakdown |
| `GET` | `/reports/heatmap` | Booking heatmap by day/hour |
| `GET` | `/dashboard/stats` | KPI counts for dashboard |
| `GET` | `/notifications` | Notification feed for current user |
| `GET` | `/activity-logs` | Searchable activity log |

---

## Design System

The frontend is built on a locked design system (`DESIGN_GUIDE.md`):

- **Colours** — all via CSS custom properties (`--color-*`). Operations blue `#2F5DE0` accent, six semantic status colours. Zero raw hex in component code.
- **Spacing** — strict 4px scale (`4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px`). No arbitrary values.
- **Typography** — Inter for UI, IBM Plex Mono for asset tags/IDs/numerics. Max 3 font sizes per screen.
- **Shared components** — `<StatusBadge>` (single status→colour lookup), `<KpiCard>` (exact two-row metric layout), `<Layout>` (fixed 240px sidebar, 64px top bar, 1280px content width).

---

## License

MIT © 2026 — Built for Odoo Hackathon 2026.

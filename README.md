# TransitOps — Smart Transport Operations Platform

Odoo Hackathon project. Full plans in [`../PLANS/`](../PLANS/).

## Structure

```
transitops-app/
├── client/   # React + Vite web app — 4 staff roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst)
├── server/   # Express + Prisma + Neon Postgres API — auth, RBAC, business rules
└── mobile/   # Driver PWA — phone login, assigned trips, GPS tracking, fuel photo proof, swipe-to-complete
```

## Setup

```bash
# server
cd server && npm install
cp .env.example .env   # add Neon DATABASE_URL + JWT_SECRET
npx prisma migrate dev --name init
npx prisma db seed
npm run dev            # :5000

# client (web)
cd client && npm install && npm run dev    # :5173

# mobile (driver PWA)
cd mobile && npm install && npm run dev    # :5174
```

## Demo credentials (seeded)

| Role | Email / Phone | Password |
|---|---|---|
| Fleet Manager | manager@transitops.in | demo1234 |
| Dispatcher | dispatch@transitops.in | demo1234 |
| Safety Officer | safety@transitops.in | demo1234 |
| Financial Analyst | finance@transitops.in | demo1234 |
| Driver (mobile) | phone, set by Dispatcher | set by Dispatcher |

## Docs

- Module plans: `../PLANS/00-OVERVIEW.md` → `12-GPS-TRACKING.md`
- DB schema: `../PLANS/PRISMA-SCHEMA.pdf` (source of truth: `server/prisma/schema.prisma`)
- Git workflow: `../PLANS/10-GIT-WORKFLOW.md` — all commits made manually by team members

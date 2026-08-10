# OrderFlow API

Production-minded NestJS backend for product catalog and order lifecycle management. Built as a portfolio project to demonstrate clean API design, JWT role-based access, Prisma/PostgreSQL persistence, Docker packaging, and CI.

## Problem

Many demo backends stop at CRUD. Real commerce APIs need authenticated roles, inventory-aware order creation, and controlled status transitions. OrderFlow API models that slice end-to-end: customers place orders, admins move them through fulfillment, and clients get consistent validation and error envelopes.

## Features

- JWT authentication with roles: `ADMIN`, `CUSTOMER`
- Register / login, current-user profile, admin user listing
- Product CRUD (admin writes; public/customer reads active catalog)
- Order creation with stock decrement and line items
- Order status transitions: `PENDING → PAID → SHIPPED → DELIVERED` (or `CANCELLED` from `PENDING`/`PAID`)
- class-validator DTOs, pagination helpers, global exception filter
- Swagger/OpenAPI at `/api/docs`
- Prisma schema + seed (admin + sample products)
- Docker Compose (API + PostgreSQL)
- GitHub Actions CI (install, Prisma generate, unit tests)

## Stack

| Layer | Choice |
| --- | --- |
| Runtime | Node.js 22 |
| Framework | NestJS (strict TypeScript) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Auth | Passport JWT + bcrypt |
| Docs | Swagger (`@nestjs/swagger`) |
| Packaging | Docker multi-stage + Compose |

## Architecture

```
Client → NestJS (global prefix /api)
           ├─ AuthModule      (register/login, JWT)
           ├─ UsersModule     (me, admin list)
           ├─ ProductsModule  (catalog + admin mutations)
           ├─ OrdersModule    (create, list, status transitions)
           └─ PrismaModule    (PostgreSQL access)
```

Status rules live in a pure helper (`src/orders/order-status.ts`) so they are unit-tested without a database.

## Run with Docker

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Postgres: `localhost:5432` (user/password/db: `orderflow`)

On startup the API container runs migrations and seeds demo data.

### Seed accounts

| Email | Password | Role |
| --- | --- | --- |
| `admin@orderflow.dev` | `Admin123!` | ADMIN |
| `customer@orderflow.dev` | `Customer123!` | CUSTOMER |

## Local development (without Docker for the API)

1. Start Postgres (Compose DB only is fine):

```bash
docker compose up -d postgres
```

2. Copy env and install:

```bash
cp .env.example .env
npm ci
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

## Environment

See `.env.example`:

| Variable | Description |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | HMAC secret for access tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `1d`) |

## API overview

Base path: `/api`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Creates `CUSTOMER` |
| POST | `/auth/login` | public | Returns JWT |
| GET | `/users/me` | JWT | Current user |
| GET | `/users` | ADMIN | List users |
| GET | `/products` | public | Paginated (`page`, `limit`) |
| GET | `/products/:id` | public | Product detail |
| POST | `/products` | ADMIN | Create product |
| PATCH | `/products/:id` | ADMIN | Update product |
| DELETE | `/products/:id` | ADMIN | Soft-delete (`isActive=false`) |
| POST | `/orders` | JWT | Create order from items |
| GET | `/orders` | JWT | Own orders; all for admin |
| GET | `/orders/:id` | JWT | Order detail |
| PATCH | `/orders/:id/status` | ADMIN | Transition status |

Errors use a consistent JSON shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid status transition: PENDING → DELIVERED",
  "path": "/api/orders/.../status",
  "timestamp": "2026-08-10T00:00:00.000Z"
}
```

Interactive docs: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Tests

Unit tests cover order status transition rules (no database required):

```bash
npm test
```

CI runs `npm ci`, `prisma generate`, and `npm test` — see `.github/workflows/ci.yml`.

## Acceptance criteria

1. `docker compose up --build` starts API + Postgres
2. Swagger is available at `/api/docs`
3. You can register/login, create a product (admin), create an order (customer), and transition status (admin)
4. CI workflow file exists at `.github/workflows/ci.yml`
5. This README documents problem, features, stack, architecture, Docker, env, API, tests, and acceptance criteria

## License

MIT

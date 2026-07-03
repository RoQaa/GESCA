# GESCA — Field Sales Management System: Architecture Design

## Overview

A production-grade backend for a **Field Sales Attendance & Visit Management System** built on
Node.js 22 LTS + TypeScript, Express.js, Prisma ORM, PostgreSQL, and Redis. The system manages
field employees, daily visit tasks, GPS check-in/out, image uploads, visit reports, analytics, and
notifications — designed to serve tens of thousands of concurrent users.

> [!IMPORTANT]
> The existing codebase is JavaScript/CommonJS. The migration plan below transitions the project
> to **TypeScript + ESM** while preserving what can be reused (error handler logic, sanitize util,
> AppError class). All new files will be TypeScript-first, and the existing JS files will be
> replaced/ported during execution.

---

## Current State Assessment

| Item | Current | Target |
|---|---|---|
| Language | JavaScript (CommonJS) | TypeScript (ESM-compatible, `"type": "module"` via `ts-node`) |
| Framework | Express 5 | Express 5 (keep) |
| ORM | Prisma 6 (basic schema) | Prisma 6 (full redesigned schema) |
| Validation | express-validator | **Zod** (replace) |
| Logging | morgan / morgan-body | **Winston** (replace) |
| Auth | None | JWT + Refresh Tokens + bcrypt |
| Cache | None | Redis (ioredis) |
| Images | None | Multer + Sharp |
| Architecture | None | Clean Architecture |

---

## Architectural Decision Records (ADRs)

### ADR-1: Clean Architecture with Repository Pattern
**Decision**: Controllers → Services → Repositories → Prisma  
**Rationale**: Decouples business logic from data access; enables unit testing of services without a DB.

### ADR-2: TypeScript Strict Mode
**Decision**: `"strict": true` in `tsconfig.json`  
**Rationale**: Catches bugs at compile time. Eliminates entire categories of runtime errors.

### ADR-3: Zod over express-validator
**Decision**: Replace `express-validator` with Zod  
**Rationale**: Zod schemas double as TypeScript type definitions (`z.infer<typeof schema>`), eliminating redundant type declarations. Validates body, params, query, headers, and files in one layer.

### ADR-4: ioredis over node-redis
**Decision**: Use `ioredis` for Redis integration  
**Rationale**: Better TypeScript types, Cluster support, built-in retry strategy, and widely used in enterprise Node.js SaaS products (Vercel, Linear).

### ADR-5: UUID v7 Primary Keys
**Decision**: Use UUID v7 (time-ordered) instead of v4  
**Rationale**: UUID v7 is lexicographically sortable (like ULIDs), significantly improving B-tree index performance vs. random v4 UUIDs while retaining global uniqueness.

### ADR-6: Cursor Pagination over Offset Pagination
**Decision**: Implement cursor-based pagination for all list endpoints  
**Rationale**: Offset pagination degrades at scale (`OFFSET 50000` forces PostgreSQL to scan 50,000 rows). Cursor pagination using `createdAt + id` is O(log n) via index seek.

### ADR-7: Prisma $transaction for atomicity
**Decision**: All multi-step write operations use Prisma interactive transactions  
**Rationale**: Prevents partial writes (e.g., creating a visit without its GPS location record).

### ADR-8: Winston with daily log rotation
**Decision**: Winston + `winston-daily-rotate-file`  
**Rationale**: Prevents unbounded log file growth in production. Supports log shipping to external systems.

### ADR-9: Background Jobs via Bull/BullMQ
**Decision**: Design is **background-job-ready** — Redis is already present, BullMQ queues can be plugged in for notifications, email, and report generation without architectural changes.

### ADR-10: GPS Mock Detection
**Decision**: Detect mocked GPS via accuracy thresholds, speed/altitude anomaly detection, and device metadata cross-referencing stored on the device info column  
**Rationale**: Sub-10m accuracy with 0 speed while "moving" is a strong mock signal.

---

## System Modules

| Module | Responsibility |
|---|---|
| **Auth** | Register, Login, Refresh, Logout, Forgot/Reset Password, Email Verification |
| **Users / Employees** | CRUD, role management, profile, avatar upload |
| **Customers** | Customer master data, contact info, location |
| **Locations** | GPS coordinate management, geofence definitions |
| **Tasks** | Daily visit task assignment, scheduling |
| **Visits** | Visit lifecycle: pending → checked-in → completed |
| **Attendance** | GPS check-in/out, mock detection, distance validation |
| **Reports** | Visit report submission, products, feedback, competitors |
| **Images** | Multi-image upload, Sharp resize, thumbnail generation |
| **Analytics** | Aggregated dashboards, KPIs, attendance rates |
| **Notifications** | Push/in-app notifications, notification preferences |
| **Settings** | System configuration, geofence radius, allowed hours |

---

## Folder Structure (Target)

```
f:/GESCA/backend/
├── src/
│   ├── config/                    # All configuration (env, database, redis, logger, cors, etc.)
│   │   ├── env.config.ts          # Zod-validated env variables — app crashes on missing vars
│   │   ├── database.config.ts     # Prisma singleton client
│   │   ├── redis.config.ts        # ioredis singleton client
│   │   ├── logger.config.ts       # Winston logger factory
│   │   └── cors.config.ts         # CORS options object
│   │
│   ├── constants/                 # App-wide string enums and constant values
│   │   ├── roles.constants.ts
│   │   ├── permissions.constants.ts
│   │   ├── http-status.constants.ts
│   │   └── cache-keys.constants.ts
│   │
│   ├── types/                     # Global TypeScript types and interfaces
│   │   ├── express.d.ts           # Augment Express Request (req.user, req.requestId)
│   │   ├── api-response.types.ts  # Standardized API response shape
│   │   └── pagination.types.ts    # Cursor/offset pagination types
│   │
│   ├── exceptions/                # Custom exception classes
│   │   ├── AppError.ts            # Base operational error
│   │   ├── ValidationError.ts     # 422 Zod errors
│   │   ├── AuthError.ts           # 401/403
│   │   ├── NotFoundError.ts       # 404
│   │   └── ConflictError.ts       # 409
│   │
│   ├── middlewares/               # Express middleware (NOT business logic)
│   │   ├── authenticate.middleware.ts   # JWT verification
│   │   ├── authorize.middleware.ts      # Role/permission guard
│   │   ├── validate.middleware.ts       # Zod schema validation factory
│   │   ├── rateLimiter.middleware.ts    # Per-route rate limiters
│   │   ├── requestId.middleware.ts      # Attach UUID to every request
│   │   ├── requestLogger.middleware.ts  # Winston HTTP request logging
│   │   ├── errorHandler.middleware.ts   # Global error handler (port of errorController.js)
│   │   └── upload.middleware.ts         # Multer configuration factory
│   │
│   ├── validators/                # Zod schemas grouped by module
│   │   ├── auth.validator.ts
│   │   ├── employee.validator.ts
│   │   ├── customer.validator.ts
│   │   ├── task.validator.ts
│   │   ├── visit.validator.ts
│   │   ├── attendance.validator.ts
│   │   ├── report.validator.ts
│   │   └── common.validator.ts    # shared schemas (pagination, UUID param, etc.)
│   │
│   ├── repositories/              # Data access layer — ONLY Prisma calls live here
│   │   ├── base.repository.ts     # Generic CRUD base class
│   │   ├── user.repository.ts
│   │   ├── customer.repository.ts
│   │   ├── task.repository.ts
│   │   ├── visit.repository.ts
│   │   ├── attendance.repository.ts
│   │   ├── report.repository.ts
│   │   └── notification.repository.ts
│   │
│   ├── services/                  # Business logic layer — orchestrates repositories
│   │   ├── auth.service.ts
│   │   ├── token.service.ts       # JWT + Refresh token lifecycle
│   │   ├── password.service.ts    # bcrypt, reset token generation
│   │   ├── email.service.ts       # Nodemailer / future provider
│   │   ├── employee.service.ts
│   │   ├── customer.service.ts
│   │   ├── task.service.ts
│   │   ├── visit.service.ts
│   │   ├── attendance.service.ts  # GPS validation, mock detection, geofence check
│   │   ├── report.service.ts
│   │   ├── image.service.ts       # Sharp processing, thumbnail generation
│   │   ├── analytics.service.ts
│   │   ├── notification.service.ts
│   │   └── cache.service.ts       # Redis abstraction (get/set/invalidate)
│   │
│   ├── controllers/               # HTTP layer — parse request, call service, send response
│   │   ├── auth.controller.ts
│   │   ├── employee.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── task.controller.ts
│   │   ├── visit.controller.ts
│   │   ├── attendance.controller.ts
│   │   ├── report.controller.ts
│   │   ├── image.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── notification.controller.ts
│   │
│   ├── routes/                    # Express Router — wires middlewares + controllers
│   │   ├── index.ts               # Root router, mounts all sub-routers
│   │   ├── auth.routes.ts
│   │   ├── employee.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── task.routes.ts
│   │   ├── visit.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── report.routes.ts
│   │   ├── image.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── notification.routes.ts
│   │
│   ├── utils/                     # Pure helper functions (no side effects)
│   │   ├── response.util.ts       # Standardized API response builder
│   │   ├── pagination.util.ts     # Cursor pagination builder
│   │   ├── gps.util.ts            # Haversine distance, mock detection scoring
│   │   ├── date.util.ts           # Date formatting, timezone helpers
│   │   ├── crypto.util.ts         # Random token generation, hashing
│   │   └── sanitize.util.ts       # Port of existing sanitize.js
│   │
│   ├── helpers/                   # Stateful helpers that use services/config
│   │   └── catchAsync.ts          # Async error wrapper (port of catchAsync.js)
│   │
│   ├── database/
│   │   └── prisma/
│   │       ├── schema.prisma      # Full redesigned schema
│   │       └── migrations/        # Auto-generated migration files
│   │
│   ├── uploads/                   # Multer disk storage destination
│   │   ├── images/
│   │   │   ├── originals/
│   │   │   └── thumbnails/
│   │   └── temp/
│   │
│   ├── logs/                      # Winston daily rotated logs
│   │   ├── error/
│   │   ├── combined/
│   │   ├── access/
│   │   └── audit/
│   │
│   ├── app.ts                     # Express app factory (replaces app.js)
│   └── server.ts                  # Process entrypoint (replaces server.js)
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── routes/
│   └── fixtures/
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── docker-compose.yml
│
├── .env.example
├── .env
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── package.json
```

---

## Database Schema (High-Level ERD)

```
Users ──────────────────── Roles
  │                          │
  │                     Permissions
  │                          │
  ├── RefreshTokens      RolePermissions
  ├── PasswordResets
  ├── EmailVerifications
  │
  ├── [as Manager]──── Teams ──── [as Employee]
  │
  └── [as Employee]
        │
        ├── Attendances
        │     └── GpsReadings (each attendance has multiple GPS snapshots)
        │
        ├── Tasks ──── Customers ──── Locations
        │
        └── Visits
              ├── VisitReports
              │     └── ReportImages
              ├── VisitProducts
              ├── VisitCompetitors
              └── VisitImages

Notifications ──── Users
Settings (key-value store)
AuditLogs ──── Users
```

---

## Key Tables (Summary)

| Table | Purpose |
|---|---|
| `users` | All system users (admin, manager, employee) |
| `roles` | Admin, Manager, SalesEmployee |
| `permissions` | Granular action permissions |
| `role_permissions` | M:M roles ↔ permissions |
| `user_roles` | M:M users ↔ roles |
| `refresh_tokens` | Refresh token rotation store |
| `password_resets` | Secure OTP/token for password reset |
| `email_verifications` | Email verification tokens |
| `teams` | Manager → Employee grouping |
| `customers` | Customer master data |
| `customer_locations` | One or more GPS coordinates per customer |
| `tasks` | Daily assignment: employee + customer + date |
| `visits` | Lifecycle record of a task execution |
| `attendances` | Check-in / check-out with GPS data |
| `gps_readings` | Continuous GPS snapshots during visit |
| `visit_reports` | Structured report form per visit |
| `report_images` | Images attached to reports |
| `visit_products` | Products presented per visit |
| `visit_competitors` | Competitor info captured per visit |
| `images` | Centralized image metadata (path, size, type) |
| `notifications` | In-app notification records |
| `notification_preferences` | Per-user notification settings |
| `settings` | Key-value system configuration |
| `audit_logs` | Immutable record of state-changing actions |

---

## API Endpoint Map (Overview)

### Auth (`/api/v1/auth`)
| Method | Endpoint | Access |
|---|---|---|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/refresh-token` | Public |
| POST | `/logout` | Auth |
| POST | `/forgot-password` | Public |
| POST | `/reset-password` | Public |
| POST | `/verify-email` | Auth |
| GET | `/me` | Auth |

### Employees (`/api/v1/employees`)
| Method | Endpoint | Access |
|---|---|---|
| GET | `/` | Admin, Manager |
| POST | `/` | Admin |
| GET | `/:id` | Admin, Manager |
| PATCH | `/:id` | Admin |
| DELETE | `/:id` | Admin |
| PATCH | `/:id/avatar` | Self |

### Tasks (`/api/v1/tasks`)
| Method | Endpoint | Access |
|---|---|---|
| GET | `/` | Admin, Manager |
| POST | `/` | Admin, Manager |
| GET | `/:id` | Auth |
| PATCH | `/:id` | Admin, Manager |
| DELETE | `/:id` | Admin |
| GET | `/my-tasks` | Employee |

### Visits (`/api/v1/visits`)
| Method | Endpoint | Access |
|---|---|---|
| GET | `/` | Admin, Manager |
| GET | `/:id` | Auth |
| PATCH | `/:id` | Auth |

### Attendance (`/api/v1/attendance`)
| Method | Endpoint | Access |
|---|---|---|
| POST | `/check-in` | Employee |
| POST | `/check-out` | Employee |
| GET | `/` | Admin, Manager |
| GET | `/my-attendance` | Employee |

### Reports (`/api/v1/reports`)
| Method | Endpoint | Access |
|---|---|---|
| POST | `/` | Employee |
| GET | `/` | Admin, Manager |
| GET | `/:id` | Auth |

### Analytics (`/api/v1/analytics`)
| Method | Endpoint | Access |
|---|---|---|
| GET | `/dashboard` | Admin, Manager |
| GET | `/attendance-rate` | Admin, Manager |
| GET | `/visit-summary` | Admin, Manager |
| GET | `/employee-performance` | Admin, Manager |

---

## Security Architecture

```
Internet → CloudFlare/Load Balancer
         → Helmet (HTTP security headers)
         → CORS (allowlist-only origins)
         → Rate Limiter (per-IP, per-route, per-user)
         → Request ID (UUID v7, all logs correlated)
         → Zod Validation (body/params/query/files)
         → authenticate.middleware (JWT verify)
         → authorize.middleware (RBAC)
         → Controller
         → Service
         → Repository (Prisma parameterized queries — SQL injection proof)
```

---

## Performance Architecture

| Technique | Where Applied |
|---|---|
| Redis cache (TTL-based) | GET endpoints: employee lists, customer lists, task lists |
| Cache invalidation | On CUD operations, related cache keys are deleted |
| Cursor pagination | All collection endpoints (no OFFSET) |
| Database indexes | Composite indexes on `(employeeId, date)`, `(customerId, status)`, etc. |
| Prisma `select` projections | Never `SELECT *` — always select only required fields |
| Prisma `include` with count | Avoid N+1 with eager loading where needed |
| Connection pooling | PgBouncer-compatible via Prisma's built-in pool |
| Response compression | `compression` middleware for all responses |
| Sharp image resizing | Images resized to max 1920px on upload; thumbnails at 200px |
| Async non-blocking | All I/O operations are async/await — never blocking the event loop |

---

## Migration Strategy (JS → TS)

The existing JS files will be migrated/replaced in this order:

1. `package.json` — add TypeScript + all new dependencies
2. `tsconfig.json` — strict TypeScript configuration
3. `server.ts` — replaces `server.js`
4. `app.ts` — replaces `app.js`
5. `utils/appError.ts` — port of `appError.js`
6. `middlewares/errorHandler.middleware.ts` — port of `errorController.js`
7. All new modules built top-down per feature

---

## Execution Plan (Step-by-Step)

| Step | Task |
|---|---|
| ✅ Step 1 | Architecture Design (this document) |
| Step 2 | Package setup + TypeScript config + ESLint/Prettier |
| Step 3 | Config layer (env, database, redis, logger) |
| Step 4 | Database schema (Prisma) — full redesign |
| Step 5 | Base utilities + exceptions + response builder |
| Step 6 | Middleware layer (error handler, request logger, etc.) |
| Step 7 | Auth module (full implementation) |
| Step 8 | Employee module |
| Step 9 | Customer + Location module |
| Step 10 | Task module |
| Step 11 | Visit module |
| Step 12 | Attendance + GPS module |
| Step 13 | Report + Image module |
| Step 14 | Analytics module |
| Step 15 | Notifications module |
| Step 16 | Settings module |
| Step 17 | Docker setup |

---

## Open Questions

> [!IMPORTANT]
> Please review and answer these before I proceed to Step 2.

1. **Language migration**: The existing code is JavaScript/CommonJS. Should I **fully migrate to TypeScript** (recommended, required by your spec), or keep JS and only add TS for new files?
2. **Email provider**: For auth emails (verification, password reset) — which provider should I configure? Options: **Nodemailer + SMTP**, **SendGrid**, **Resend**, or leave it as a pluggable interface with environment variables?
3. **File storage**: Should images be stored **on disk** (local filesystem, suitable for single-server or NFS) or should I prepare for **cloud storage** (S3-compatible interface)? I recommend building a storage adapter interface so it's switchable.
4. **Project root**: Should the `src/` folder remain at `f:/GESCA/backend/src/` (current), or should I restructure so that `src/` is directly inside `f:/GESCA/backend/`? (Currently `package.json` is inside `src/`, which is non-standard.)
5. **Redis**: Is a local Redis instance running, or should I include Redis setup in Docker Compose only?

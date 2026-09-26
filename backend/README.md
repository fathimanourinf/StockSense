# StockSense — Inventory Management System (Backend)

Node.js + Express + MongoDB backend for a modular IMS: products, multi-warehouse
stock, receipts, delivery orders, internal transfers, stock adjustments, and a
full audit-trail ledger that powers the dashboard KPIs and Move History screen.

## Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT auth (Bearer token)
- bcryptjs for password hashing
- OTP-based password reset (logs to console in dev, or sends via SMTP if configured)

## Setup

```bash
npm install
cp .env.example .env      # then fill in MONGO_URI, JWT_SECRET, etc.
npm run dev                # nodemon, auto-restarts
# or
npm start
```

Requires a running MongoDB instance (local or Atlas) — set `MONGO_URI` accordingly.

## Data model summary

- **User** — inventory_manager / warehouse_staff roles
- **Category**, **Warehouse**, **Location** — reference/setup data
- **Product** — SKU, category, unit of measure, reorder rules
- **StockItem** — live on-hand quantity per (product, location) — this is what
  "stock availability" reads from
- **StockLedger** — append-only audit trail of every stock movement (this is
  the "Move History" screen's data source)
- **Receipt**, **DeliveryOrder**, **InternalTransfer**, **StockAdjustment** —
  the four operation documents, each with a `status` lifecycle:
  `draft → waiting → ready → done` (or `cancelled`)

All stock quantity changes flow through one function,
`utils/stockService.js#applyStockMovement`, so `StockItem` and `StockLedger`
can never drift out of sync — every controller calls into it instead of
touching stock directly.

## API overview

| Area | Base path | Notes |
|---|---|---|
| Auth | `/api/auth` | signup, login, forgot-password → OTP → verify-otp → reset-password |
| Products | `/api/products` | CRUD + `/:id/availability` (stock per location) |
| Categories | `/api/categories` | CRUD |
| Warehouses | `/api/warehouses` | CRUD + `/locations/all`, `/locations` |
| Receipts | `/api/receipts` | create → edit → `/:id/validate` (stock +) / `/:id/cancel` |
| Deliveries | `/api/deliveries` | create → pick/pack → `/:id/validate` (stock -) / `/:id/cancel` |
| Transfers | `/api/transfers` | create → `/:id/validate` (moves stock between locations) |
| Adjustments | `/api/adjustments` | create (auto-computes diff vs system qty) → `/:id/validate` |
| Dashboard | `/api/dashboard` | `/kpis`, `/move-history`, `/low-stock` |

All routes except `/api/auth/*` and `/api/health` require
`Authorization: Bearer <token>`.

### Example: full receipt flow

```
POST /api/receipts
{
  "supplier": "Acme Steel Co.",
  "location": "<locationId>",
  "lines": [{ "product": "<productId>", "expectedQty": 50 }]
}
→ status: "draft"

POST /api/receipts/:id/validate
→ stock at that location +50, status: "done", entry written to StockLedger
```

### Example: internal transfer

```
POST /api/transfers
{
  "fromLocation": "<mainWarehouseLocationId>",
  "toLocation": "<productionFloorLocationId>",
  "lines": [{ "product": "<productId>", "quantity": 30 }]
}

POST /api/transfers/:id/validate
→ fromLocation stock -30, toLocation stock +30 (total unchanged), two ledger entries
```

## Filtering

List endpoints (`/api/receipts`, `/api/deliveries`, `/api/transfers`,
`/api/adjustments`) accept `?status=` (draft/waiting/ready/done/cancelled) and
`?location=`, matching the dashboard's dynamic filters. Products support
`?search=` (SKU/name) and `?category=`.

## Notes / what's intentionally left simple

- No refresh-token rotation — JWT expires per `JWT_EXPIRES_IN` and the user
  re-logs in. Fine for a project like this; swap in refresh tokens later if needed.
- OTP is a 6-digit code stored in Mongo with a TTL index (auto-expires) —
  no third-party OTP service required.
- Multi-line document validation isn't wrapped in a Mongo transaction by
  default (works fine on a standalone MongoDB). If you deploy to a replica
  set, you can pass a `session` through `applyStockMovement` for atomicity.

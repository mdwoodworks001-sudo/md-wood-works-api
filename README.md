# MD Wood Works API

TypeScript + Express 5 + MongoDB + Mongoose backend, built to match the existing
Angular frontend's service contracts exactly (see `frontend/` in the parent repo).

## Architecture

```
Angular  →  Express Routes  →  Controllers  →  Services  →  Mongoose Models  →  MongoDB
```

- **Routes** — only wire up HTTP method + path + middleware, no business logic.
- **Controllers** — thin: parse request, call service, shape response.
- **Services** — all business rules (stock checks, pricing, transactions, auth).
- **Models** — persistence + schema-level validation.

## Getting started

```bash
cd backend
cp .env.example .env   # then fill in real secrets
npm install
npm run dev
```

The API starts at `http://localhost:5000`. Health check:

```
GET http://localhost:5000/api/health
```

### Seed sample data (admin user, categories, products)

```bash
npm run seed
```

Creates `admin@mdwoodworks.com` / `Admin@12345` as an admin user — change this
password immediately in any non-local environment.

### Build for production

```bash
npm run build
npm start
```

## Environment variables

See `.env.example`. At minimum you must set:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## API surface

```
/api
├── /auth
│   ├── POST   /register
│   ├── POST   /login
│   ├── POST   /admin-login
│   ├── POST   /refresh
│   └── POST   /logout
│
├── /users
│   ├── GET    /me
│   ├── GET    /admin
│   └── PATCH  /admin/:id/status
│
├── /products
│   ├── GET    /
│   ├── GET    /featured
│   ├── GET    /categories
│   ├── GET    /slug/:slug
│   ├── GET    /:id
│   └── /admin
│       ├── POST   /
│       ├── PUT    /:id
│       ├── DELETE /:id
│       └── POST   /:id/images   (multipart, field name "images", up to 6 files)
│
├── /orders
│   ├── POST   /
│   ├── GET    /my-orders
│   ├── GET    /:id
│   ├── PATCH  /:id/cancel
│   └── /admin
│       ├── GET    /
│       ├── PATCH  /:id/status
│       └── GET    /dashboard-stats
│
├── /reviews
│   ├── POST   /
│   ├── GET    /product/:productId
│   ├── PUT    /:id?product=<productId>
│   └── DELETE /:id?product=<productId>
│
├── /categories
│   ├── GET    /
│   └── /admin
│       ├── GET    /
│       ├── POST   /
│       ├── PUT    /:id
│       └── DELETE /:id
│
├── /uploads
│   └── POST   /   (multipart, field name "files", admin only)
│
├── /dashboard
│   └── GET    /overview
│
└── /health
    └── GET    /
```

All responses use a consistent envelope:

```json
{ "success": true, "message": "...", "data": {} }
{ "success": false, "message": "...", "code": "SOME_ERROR_CODE" }
```

## Notes for the Angular client

The `/products` and `/orders` list endpoints return a paginated shape inside `data`:

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

Wrap your Angular `HttpClient` responses in an `ApiResponse<T>` interface (or an
interceptor) that unwraps `data` centrally, e.g.:

```ts
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
```

## Order creation is transactional

`POST /orders` uses a MongoDB session/transaction: it re-reads current product
prices and stock server-side (never trusts client-submitted prices), decrements
stock, and creates the order atomically. `PATCH /orders/:id/cancel` restores
stock the same way.

# SmartCart Microservices — API Versioning Strategy

## 1. Versioning Scheme: URL Path Versioning

All API endpoints are prefixed with a version segment in the URL path:

```
http://localhost:8080/api/v1/<resource>
```

**Rationale for URL-path versioning over alternatives:**

| Approach | Example | Decision |
|---|---|---|
| **URL path** ✅ | `/api/v1/products` | Chosen — explicit, cacheable, easy to route |
| Header versioning | `API-Version: 1` | Harder to test, not visible in browser |
| Query param | `/products?version=1` | Pollutes query string, breaks caching |
| Content-type | `Accept: application/vnd.sc.v1+json` | Verbose, unfamiliar to most clients |

---

## 2. Current Version: v1

All five microservices expose resources under `/api/v1/`:

| Service | Base Path | Key Endpoints |
|---|---|---|
| user-service | `/api/v1/auth` | `POST /register`, `POST /login`, `GET /users/:id` |
| product-service | `/api/v1/products` | `GET /`, `GET /:id`, `POST /` (admin), `PUT /:id` (admin) |
| order-service | `/api/v1/orders` | `POST /checkout`, `GET /my/:userId`, `GET /:id`, `PATCH /:id/status` |
| order-service | `/api/v1/orders/cart` | `POST /items`, `GET /:userId`, `DELETE /items/:itemId` |
| payment-service | `/api/v1/payments` | `GET /order/:orderId`, `GET /:id` |
| api-gateway | `/api/v1/*` | All of the above proxied + `GET /orders/:id/details` (composition) |

---

## 3. Breaking vs. Non-Breaking Changes

### Breaking changes → require new version `/api/v2/`

A breaking change forces clients to update their code:

- Removing or renaming a field in a response body  
  *e.g.* `order.total` renamed to `order.total_amount`
- Changing a field's type  
  *e.g.* `product.price` from `string "79.99"` to `number 79.99`
- Removing an endpoint  
  *e.g.* deleting `GET /products/:id`
- Changing HTTP method semantics  
  *e.g.* `POST /orders` → `PUT /orders`
- Making a previously optional request field mandatory
- Changing authentication requirements (e.g. adding auth to a public endpoint)

### Non-breaking changes → stay on `/api/v1/`

A non-breaking (additive) change is safe for existing clients:

- Adding new optional response fields  
  *e.g.* adding `product.discount_pct` to the products response
- Adding new optional request fields
- Adding new endpoints entirely  
  *e.g.* adding `GET /products/search`
- Adding new HTTP methods to existing resources
- Relaxing validation rules (e.g. making a required field optional)

---

## 4. Versioning in Code

### Gateway routing (Express)

Each version maps to a distinct route prefix. Adding v2 requires no changes to v1 services — just new route registrations in the gateway:

```js
// v1 routes — current
app.use('/api/v1/auth',     proxy(USER_SVC,    { ... }));
app.use('/api/v1/products', proxy(PRODUCT_SVC, { ... }));
app.use('/api/v1/orders',   proxy(ORDER_SVC,   { ... }));
app.use('/api/v1/payments', proxy(PAYMENT_SVC, { ... }));

// v2 routes — future (additive, does not affect v1)
app.use('/api/v2/products', proxy(PRODUCT_SVC_V2, { ... }));
```

### Service-level versioning

Each microservice internally prefixes all routes with `/v1/`:

```js
// order-service/src/server.js
app.use('/v1/orders', orderRoutes);

// The gateway appends /v1/ when proxying:
proxyReqPathResolver: (req) => `/v1/orders${req.url}`
```

---

## 5. Deprecation Policy

When a breaking change is needed:

1. Release `/api/v2/` endpoint alongside `/api/v1/`
2. Add `Deprecation` and `Sunset` response headers to v1:
   ```
   Deprecation: true
   Sunset: Sat, 01 Jan 2027 00:00:00 GMT
   ```
3. Communicate via changelog with at least **3 months** notice
4. Remove `/api/v1/` only after sunset date

---

## 6. Semantic Versioning Mapping

| API Version | SemVer range | Meaning |
|---|---|---|
| `/api/v1/` | `1.x.x` | Major: breaking contract change |
| — | `1.2.x` | Minor: new non-breaking endpoints or fields |
| — | `1.2.3` | Patch: bug fixes, no contract change |

The public API version (`v1`, `v2`) advances only on **major** SemVer bumps. Minor/patch releases are transparent to API consumers.

---

## 7. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                  React SPA — localhost:3000                      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP  /api/v1/*
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY  :8080                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  JWT verify │  │ Rate Limiter │  │  API Composition       │ │
│  │  (all routes│  │ 200/15m glob │  │  GET /orders/:id/details│ │
│  │   except /  │  │  10/15m auth │  │  (order + payments)    │ │
│  │   health)   │  └──────────────┘  └────────────────────────┘ │
│  └─────────────┘                                                │
└──┬──────────┬────────────┬────────────────┬─────────────────────┘
   │          │            │                │
   │/v1/auth  │/v1/products│/v1/orders      │/v1/payments
   ▼          ▼            ▼                ▼
┌──────┐  ┌────────┐  ┌─────────┐      ┌─────────┐
│ USER │  │PRODUCT │  │  ORDER  │      │PAYMENT  │
│ SVC  │  │  SVC   │  │   SVC   │      │  SVC    │
│:3001 │  │  :3002 │  │  :3003  │      │  :3004  │
└──┬───┘  └───┬────┘  └────┬────┘      └────┬────┘
   │          │            │  publish        │ consume
   ▼          ▼            │  order.placed   │
┌──────┐  ┌────────┐       └──────┐  ┌──────┘
│sc_   │  │sc_     │              ▼  ▼
│users │  │products│          ┌──────────┐     ┌──────────┐
│(PG)  │  │(PG)    │          │ RabbitMQ │     │sc_orders │
└──────┘  └────────┘          │  :5672   │     │(PG):3003 │
                               └──────────┘     └──────────┘
                                                ┌──────────┐
                                                │sc_payment│
                                                │s (PG)    │
                                                │  :3004   │
                                                └──────────┘
```

### Communication patterns

| Pattern | Used between | Protocol |
|---|---|---|
| **Synchronous REST** | Gateway → all services | HTTP/JSON |
| **Synchronous REST** | order-service → product-service (stock check) | HTTP/JSON |
| **Async Choreography Saga** | order-service → RabbitMQ → payment-service | AMQP |

### Database per Microservice

| Service | Database | Port (host) |
|---|---|---|
| user-service | sc_users | 5441 |
| product-service | sc_products | 5442 |
| order-service | sc_orders | 5443 |
| payment-service | sc_payments | 5444 |

No cross-service foreign keys. Services reference each other by logical ID only.

---

## 8. Docker Architecture

```
podman / docker compose
│
├── sc-frontend          (nginx:alpine)      :3000
├── sc-api-gateway       (node:20-alpine)    :8080
├── sc-user-service      (node:20-alpine)    :3001
├── sc-product-service   (node:20-alpine)    :3002
├── sc-order-service     (node:20-alpine)    :3003
├── sc-payment-service   (node:20-alpine)    :3004
├── sc-rabbitmq          (rabbitmq:3-mgmt)   :5672 / :15672
├── sc-postgres-users    (postgres:15)       :5441
├── sc-postgres-products (postgres:15)       :5442
├── sc-postgres-orders   (postgres:15)       :5443
└── sc-postgres-payments (postgres:15)       :5444

All connected via: smartcart-net (bridge)
```

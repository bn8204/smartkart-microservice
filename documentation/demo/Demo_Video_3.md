# 🎥 Demo Video 3 — Admin, Testing, CI/CD & Monitoring

**Duration:** ~5 minutes  
**Audience:** Technical evaluators, professors  
**Goal:** Show admin functionality, test results, CI/CD pipeline, and observability

---

## Scene 1: Admin Login (0:00 – 0:45)

**Screen:** Browser → http://localhost:3000

**Setup first:**
```powershell
podman exec sc-postgres-users psql -U postgres -d sc_users `
  -c "UPDATE users SET role='admin' WHERE email='admin@smartcart.com';"
```

**Say:**
> "I've promoted a user to admin role. The admin has access to the Admin Dashboard, Order Management, and Payment Verification pages — all protected by role-based access control enforced at the API Gateway."

**Show:** Admin dashboard with order statistics, approve/reject buttons on PENDING orders.

---

## Scene 2: Admin Functions (0:45 – 1:30)

**Screen:** Admin Dashboard

**Show:**
- Order statistics (total, pending, confirmed revenue)
- Click on a PENDING order → Approve button
- Order status changes to CONFIRMED

**Say:**
> "The admin can update order statuses manually. The PATCH /orders/:id/status endpoint accepts valid status values: PENDING, CONFIRMED, FAILED, SHIPPED, DELIVERED, CANCELLED. The status dropdown is validated server-side."

---

## Scene 3: Test Results (1:30 – 2:30)

**Screen:** Terminal

```bash
cd user-service && npm test
```

**Say:**
> "Running the Jest test suite for user-service. 13 unit tests covering all controller functions, and 14 integration tests using Supertest for HTTP-level testing. All mock the database and prom-client for fast, isolated execution."

**Show test results:**
- 27 tests passing
- Coverage report (lines/functions/branches)
- Note: NODE_ENV=test prevents the server from binding a port during testing

```bash
cd product-service && npm test
```

**Show:** Product service 26 tests passing

---

## Scene 4: CI/CD Pipeline (2:30 – 3:30)

**Screen:** VS Code → `.github/workflows/ci.yml` OR GitHub Actions if available

**Say:**
> "The GitHub Actions CI/CD pipeline has 3 jobs running on every push to main or develop. The test job uses a matrix strategy to test all 5 services in parallel. If all tests pass, the build job validates the docker-compose.yml and builds all Docker images. A separate security job runs npm audit for vulnerabilities."

**Point to:**
- Matrix strategy (5 services parallel)
- `fail-fast: false` (all services test even if one fails)
- Coverage artifact upload
- Docker buildkit for optimized builds
- `concurrency.cancel-in-progress: true` (saves CI minutes)

---

## Scene 5: Prometheus Metrics (3:30 – 4:15)

**Screen:** Browser → http://localhost:8080/metrics

**Say:**
> "Every service exposes a /metrics endpoint in Prometheus format. We have custom HTTP request duration histograms with method, route, and status labels. Plus all default Node.js process metrics — CPU, memory, event loop lag. These can be scraped by Prometheus and visualised in Grafana."

**Show:**
- Histogram buckets for http_request_duration_ms
- process_heap_bytes and process_cpu_user_seconds_total

---

## Scene 6: Structured Logging (4:15 – 5:00)

**Screen:** Container logs

```powershell
podman logs sc-order-service --tail 20
```

**Say:**
> "Winston provides structured JSON logging with timestamp, log level, service name, request ID, and HTTP details. The same request ID flows through all services in the call chain — this is the X-Request-ID correlation pattern. Logs are written to both console and rotating file log files inside each container."

**Point to:** requestId field in multiple log entries from the same request

---

**End of Demo 3**

---

## Summary Points for All Demos

| Feature | Demo | Evidence |
|---|---|---|
| Architecture | Demo 1 | Diagrams, container list |
| Docker | Demo 1 | podman compose ps output |
| Swagger | Demo 1 | /api-docs in browser |
| Authentication | Demo 2 | JWT token in response |
| Saga Pattern | Demo 2 | RabbitMQ UI + status change |
| Price Security | Demo 2 | server-calculated total |
| API Composition | Demo 2 | /orders/:id/details |
| Validation | Demo 2 | 400 with errors array |
| Admin Features | Demo 3 | Dashboard screenshot |
| Unit Tests | Demo 3 | Jest output |
| Integration Tests | Demo 3 | Supertest results |
| CI/CD | Demo 3 | GitHub Actions workflow |
| Metrics | Demo 3 | /metrics endpoint |
| Logging | Demo 3 | Container log output |

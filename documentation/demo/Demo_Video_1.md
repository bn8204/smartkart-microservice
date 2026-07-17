# 🎥 Demo Video 1 — Architecture & Infrastructure

**Duration:** ~5 minutes  
**Audience:** Technical evaluators, professors  
**Goal:** Show the microservices architecture, Docker setup, and all services running

---

## Scene 1: Introduction (0:00 – 0:30)

**Screen:** Project folder structure in VS Code

**Say:**
> "This is SmartCart — a production-grade e-commerce platform built using Microservices Architecture for my BITS Pilani M.Tech assignment. The application is decomposed into 5 independent services, each with its own database, communicating through REST and RabbitMQ."

**Show:**
- VS Code workspace with all 5 service folders visible
- Point out docker-compose.yml, .env.example, test-e2e.ps1

---

## Scene 2: Architecture Overview (0:30 – 1:30)

**Screen:** Open `documentation/03_Architecture.md` or the architecture diagram

**Say:**
> "Let me walk you through the architecture. At the top we have the React frontend. All requests go through the API Gateway on port 8080, which handles JWT authentication, rate limiting, and request routing. Below the gateway are 4 business services: user-service for authentication, product-service for catalog, order-service for cart and checkout, and payment-service. Each service owns its own PostgreSQL database — this is the database-per-microservice pattern."

**Point to diagram sections as you explain.**

---

## Scene 3: Starting the Stack (1:30 – 2:30)

**Screen:** PowerShell terminal

**Commands to run:**
```powershell
# Show clean state
podman compose down -v

# Start everything
podman compose up --build
```

**Say:**
> "Starting the complete stack with a single command. The Dockerfiles build optimized Node.js images on Alpine Linux with non-root users for security."

**Show:** Build output streaming, images being created for each service.

---

## Scene 4: All Containers Running (2:30 – 3:30)

**Screen:** PowerShell terminal

**Command:**
```powershell
podman compose ps
```

**Say:**
> "All 11 containers are running and healthy. 4 PostgreSQL instances — one per service. RabbitMQ with the management UI. 4 business services plus the API gateway. And the React frontend. Notice each service has its own database — complete data isolation."

**Expected output:** All 11 containers showing `healthy` status

---

## Scene 5: Health Check (3:30 – 4:00)

**Screen:** PowerShell

**Command:**
```powershell
Invoke-RestMethod http://localhost:8080/health | ConvertTo-Json -Depth 3
```

**Say:**
> "The gateway aggregates health from all 4 services. The response shows user-service, product-service, order-service, and payment-service all UP. Each service also checks its own database connectivity."

---

## Scene 6: Swagger Documentation (4:00 – 5:00)

**Screen:** Browser → http://localhost:8080/api-docs

**Say:**
> "Every service has Swagger documentation. The gateway exposes an aggregated view of all 24 endpoints. Notice the versioning — all paths are prefixed with `/api/v1`. I can test endpoints directly from the UI."

**Action:** Click on GET /products and Execute to show live response.

---

**End of Demo 1**

---

*Key Points to Emphasise:*
- Single `podman compose up --build` starts everything
- 11 containers, 4 databases, all isolated
- Health endpoints confirm all services operational
- Swagger auto-generated from OpenAPI 3.0 specs

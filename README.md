# 🛒 SmartCart Microservices

> **Production-grade E-Commerce Platform built with Microservices Architecture**  
> BITS Pilani M.Tech — Secure Software Engineering Assignment

[![CI/CD](https://github.com/yourusername/smartcart-microservices/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/smartcart-microservices/actions/workflows/ci.yml)

---

## 📖 Documentation

> **All detailed documentation is in the [`documentation/`](documentation/) folder.**  
> Start here: [documentation/00_INDEX.md](documentation/00_INDEX.md)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser :3000)                      │
│                     React SPA + SmartCart UI                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP :8080
              ┌────────────▼────────────────────┐
              │         API GATEWAY             │
              │  JWT  •  Rate Limit  •  CORS    │
              │  Routing  •  Composition        │
              └───┬───────┬───────┬─────┬───────┘
                  │       │       │     │
           :3001  │  :3002│  :3003│:3004│
         ┌────────▼┐ ┌────▼──┐ ┌──▼────┐ ┌▼───────┐
         │  user   │ │product│ │ order │ │payment │
         │ service │ │service│ │service│ │service │
         └────┬────┘ └───┬───┘ └───┬───┘ └───┬────┘
              │           │        │ RabbitMQ │
         ┌────▼────┐ ┌────▼──┐ ┌───▼────┐ ┌──▼─────┐
         │sc_users │ │sc_pro-│ │sc_order│ │sc_pay- │
         │(pg:5432)│ │ducts  │ │s       │ │ments   │
         └─────────┘ └───────┘ └────────┘ └────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express.js 4.18 |
| Databases | PostgreSQL 15 (×4 isolated instances) |
| Message Broker | RabbitMQ 3 (AMQP) |
| Authentication | JWT (HS256) + bcryptjs |
| Containerisation | Docker / Podman + Compose |
| Frontend | React 18 |
| Testing | Jest 29 + Supertest 7 |
| CI/CD | GitHub Actions |
| Logging | Winston 3 (structured JSON) |
| Metrics | prom-client 15 (Prometheus) |
| API Docs | swagger-ui-express 5 (OpenAPI 3.0) |
| Security | Helmet 8, express-rate-limit, CORS |
| Validation | express-validator 7 |

---

## ✨ Features

### Customer
- 🔐 Secure registration and login (JWT)
- 🛍️ Browse and search product catalog
- 🛒 Shopping cart with upsert (duplicate → increment qty)
- 💳 Checkout with server-side price validation
- 📦 Real-time order tracking via Saga pattern
- 📊 Order history with pagination

### Admin
- 📋 Admin dashboard with revenue analytics
- ✅ Order approval and status management
- 💰 Payment verification
- 🏷️ Product creation and management

### Technical
- 🚪 Single entry point API Gateway
- 📨 Choreography Saga (RabbitMQ)
- 🔢 URL-path API versioning (`/api/v1/`)
- 📚 Interactive Swagger docs on every service
- 📊 Prometheus metrics (`/metrics`)
- ❤️ Health checks with dependency status
- 🆔 Distributed request correlation (X-Request-ID)
- 🛡️ DLQ (Dead Letter Queue) for fault isolation
- 🐳 Non-root Docker containers

---

## 📱 Cross-Platform Support

SmartKart supports multiple client platforms:

| Platform | Technology | Status | Access |
|----------|-----------|--------|--------|
| **🌐 Web** | React 18 SPA | ✅ Production | http://localhost:3000 |
| **📱 Android** | Flutter 3.x | ✅ Production | Native APK |
| **🍎 iOS** | Flutter 3.x | ✅ Ready | Native IPA |
| **💻 Desktop** | Flutter/Web | 🔄 Planned | Windows/Mac/Linux |

### Mobile App Features

The Flutter mobile app (`smartkart_mobile/`) provides:
- 🎨 Native Android/iOS experience with Material Design 3
- 🔐 Secure JWT authentication with device keychain storage
- 🛒 Full e-commerce functionality (browse, cart, checkout, orders)
- ⚡ Hot reload for instant development
- 📊 Clean architecture with Riverpod state management
- 🌐 Offline-first with connectivity detection
- 📱 Responsive UI for phones and tablets

**Quick Start:**
```powershell
cd smartkart_mobile
flutter pub get
flutter run --dart-define=GATEWAY_BASE_URL=http://YOUR_IP:8080/api/v1
```

See [`smartkart_mobile/README.md`](smartkart_mobile/README.md) for detailed setup instructions.

---

## 🚀 Quick Start

### Prerequisites
- [Podman Desktop](https://podman-desktop.io/) with WSL2 backend (Windows)
- Or Docker Desktop (Mac/Linux)

```powershell
# 1. Clone the repository
git clone https://github.com/yourusername/smartcart-microservices.git
cd smartcart-microservices

# 2. Set up environment variables
cp .env.example .env
# Edit .env and replace placeholder values

# 3. Build and start all containers
podman compose up --build

# 4. Verify everything is running
Invoke-RestMethod http://localhost:8080/health | ConvertTo-Json -Depth 3

# 5. Run smoke tests
.\test-e2e.ps1
```

---

## 🌐 Service URLs

| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost:3000 | React SPA |
| **API Gateway** | http://localhost:8080 | All API calls |
| **Swagger UI** | http://localhost:8080/api-docs | Interactive API docs |
| **RabbitMQ UI** | http://localhost:15672 | Message queue (guest/guest) |
| **Prometheus Metrics** | http://localhost:8080/metrics | Metrics scraping |

---

## 🔌 Microservices

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 8080 | JWT auth, routing, rate limiting, composition |
| `user-service` | 3001 | Registration, login, user profiles |
| `product-service` | 3002 | Product catalog, stock management |
| `order-service` | 3003 | Cart, checkout, Saga publisher |
| `payment-service` | 3004 | Payment processing, Saga consumer |

---

## 🐳 Docker Setup

```powershell
# Start all services (builds if needed)
podman compose up --build

# Start in background
podman compose up -d

# View logs
podman compose logs -f api-gateway

# Stop (preserves data)
podman compose down

# Clean start (removes all volumes/data)
podman compose down -v && podman compose up --build

# Status check
podman compose ps
```

---

## 🧪 Testing

```bash
# Unit tests (from service directory)
cd user-service && npm test

# Unit + integration with coverage
cd user-service && npm run test:coverage

# E2E smoke test (requires running stack)
.\test-e2e.ps1   # PowerShell
```

**Test results:** 59+ unit tests + 25+ integration tests across all services.

---

## 🚀 CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

```
Push/PR → Test (5 services parallel) → Build Docker → Security Audit
```

Every service is tested independently with Jest. Coverage reports uploaded as artifacts.

---

## 📐 API Design

All endpoints follow REST conventions with URL-path versioning:

```
POST   /api/v1/auth/register      Register user
POST   /api/v1/auth/login         Login → JWT
GET    /api/v1/products           Browse catalog (paginated)
POST   /api/v1/orders/checkout    Create order (Saga triggers)
GET    /api/v1/orders/:id/details Order + payment (composition)
GET    /api/v1/payments           Payment history
GET    /health                    Health check
GET    /metrics                   Prometheus metrics
```

**Full API Reference:** [documentation/05_API_Design.md](documentation/05_API_Design.md)  
**Interactive Docs:** http://localhost:8080/api-docs

---

## 📁 Project Structure

```
smartcart-microservices/
├── api-gateway/           # JWT auth, routing, rate limiting
├── user-service/          # Authentication & user management
├── product-service/       # Product catalog & stock
├── order-service/         # Cart, orders & Saga publisher
├── payment-service/       # Payments & Saga consumer
├── frontend/              # Dockerfile for React SPA
├── smartkart_mobile/      # 📱 Flutter mobile app (Android/iOS)
│
├── docker-compose.yml     # Full stack orchestration
├── .env.example           # Environment variables template
├── test-e2e.ps1           # End-to-end smoke test
├── .github/
│   └── workflows/
│       └── ci.yml         # GitHub Actions CI/CD
│
└── documentation/         # ← All documentation
    ├── 00_INDEX.md        # Start here
    ├── diagrams/          # Mermaid diagrams
    ├── postman/           # Postman collection
    ├── demo/              # Demo video scripts
    └── images/            # Screenshots
```

---

## 📚 Documentation

Comprehensive documentation in [`documentation/`](documentation/):

| Doc | Description |
|---|---|
| [00_INDEX.md](documentation/00_INDEX.md) | Documentation portal — start here |
| [01_Project_Overview.md](documentation/01_Project_Overview.md) | Project goals and tech stack |
| [02_Assignment_Documentation.md](documentation/02_Assignment_Documentation.md) | Full academic coverage |
| [03_Architecture.md](documentation/03_Architecture.md) | System design & ADRs |
| [05_API_Design.md](documentation/05_API_Design.md) | All 24+ REST endpoints |
| [06_Database_Design.md](documentation/06_Database_Design.md) | Schemas & indexes |
| [07_Communication_Design.md](documentation/07_Communication_Design.md) | Saga & RabbitMQ |
| [10_Security.md](documentation/10_Security.md) | OWASP, JWT, security headers |
| [11_Testing.md](documentation/11_Testing.md) | Test strategy & results |
| [12_CI_CD.md](documentation/12_CI_CD.md) | GitHub Actions pipeline |
| [18_Assignment_Compliance_Matrix.md](documentation/18_Assignment_Compliance_Matrix.md) | 40 requirements mapped |

---

## 🔒 Security Highlights

- JWT authentication (HS256, configurable expiry)
- bcrypt password hashing (cost factor 10)
- Helmet.js security headers on all services
- CORS with configurable origin whitelist
- Rate limiting (global + auth-specific)
- Input validation with express-validator
- Parameterized SQL queries (no injection possible)
- Server-side price verification at checkout
- Internal service authentication (`x-internal-secret`)
- Non-root Docker containers

---

## 📜 License

Academic project — BITS Pilani M.Tech Secure Software Engineering 2026.

---

*SmartCart Microservices v1.0.0 | Built with ❤️ for BITS Pilani*

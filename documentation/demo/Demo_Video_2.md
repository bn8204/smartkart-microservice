# 🎥 Demo Video 2 — Core E-Commerce Flow

**Duration:** ~10 minutes  
**Audience:** Technical evaluators, professors  
**Goal:** Show complete customer journey including the Choreography Saga

---

## Scene 1: Browse Products (0:00 – 1:00)

**Screen:** Browser → http://localhost:3000

**Say:**
> "The SmartCart React frontend is available on port 3000. Products are visible without login — public API. The product catalog is served by product-service from its own PostgreSQL database with 5 seed products."

**Show:**
- Products page with all 5 products
- Open DevTools Network tab to show API call to localhost:8080

---

## Scene 2: User Registration (1:00 – 2:00)

**Screen:** Browser → Registration form OR PowerShell

```powershell
$reg = Invoke-RestMethod `
  -Uri http://localhost:8080/api/v1/auth/register `
  -Method POST `
  -ContentType 'application/json' `
  -Body '{"name":"Demo User","email":"demo@smartcart.com","password":"demo1234"}'
$token = $reg.token
Write-Host "JWT Token received"
```

**Say:**
> "Registration creates a user with bcrypt-hashed password and immediately returns a JWT token. The token contains the user's ID, email, and role — the gateway uses these to authenticate all subsequent requests."

---

## Scene 3: Shopping Cart (2:00 – 3:30)

**Screen:** Frontend cart OR PowerShell

```powershell
$headers = @{ Authorization = "Bearer $token" }
# Add item to cart (upsert — same product increments quantity)
Invoke-RestMethod -Uri http://localhost:8080/api/v1/orders/cart/items `
  -Method POST -ContentType 'application/json' -Headers $headers `
  -Body '{"user_id":1,"product_id":1,"quantity":2}'

# View cart
Invoke-RestMethod http://localhost:8080/api/v1/orders/cart/1 -Headers $headers
```

**Say:**
> "Adding items to cart. Notice I only send product_id and quantity — never the price. The price is always fetched server-side. Adding the same product twice increments the quantity using PostgreSQL's ON CONFLICT UPDATE — the upsert pattern."

---

## Scene 4: Checkout + Saga (3:30 – 6:30)

**Screen:** RabbitMQ UI + Terminal side by side

**Open:** http://localhost:15672 (guest/guest) — Queues tab

```powershell
$body = @{
  user_id = 1
  shipping_address = "123 Demo Street, Mumbai"
  items = @(@{ product_id = 1; quantity = 1 })
} | ConvertTo-Json -Depth 3

$checkout = Invoke-RestMethod -Uri http://localhost:8080/api/v1/orders/checkout `
  -Method POST -ContentType 'application/json' -Headers $headers -Body $body

Write-Host "Order #$($checkout.order.id) - Status: $($checkout.order.status)"
Write-Host "Total (server-calculated): $($checkout.total)"
```

**Say:**
> "The checkout process has a critical security feature: the server fetches the authoritative price from product-service. The client cannot manipulate prices. Notice the total is calculated server-side."

**Watch RabbitMQ UI:** Show the `order.placed` message appearing in the queue.

```powershell
# Wait for Saga
Start-Sleep 2
$order = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/$($checkout.order.id)" -Headers $headers
Write-Host "Order status after Saga: $($order.status)"
```

**Say:**
> "Within 2 seconds, the Choreography Saga has completed. Payment service consumed the `order.placed` event from RabbitMQ, processed the payment, published `payment.processed`, and order-service updated the order to CONFIRMED. All automatically, without any direct service-to-service calls."

---

## Scene 5: API Composition (6:30 – 7:30)

```powershell
$details = Invoke-RestMethod `
  -Uri "http://localhost:8080/api/v1/orders/$($checkout.order.id)/details" `
  -Headers $headers
$details | ConvertTo-Json -Depth 4
```

**Say:**
> "The API Gateway provides a composition endpoint that fetches order details and payment records in a single call — two parallel requests aggregated by the gateway. This reduces client round-trips."

---

## Scene 6: Validation (7:30 – 8:30)

```powershell
# Test bad email
$bad = Invoke-WebRequest -Uri http://localhost:8080/api/v1/auth/register `
  -Method POST -ContentType 'application/json' `
  -Body '{"name":"T","email":"not-email","password":"abc"}' `
  -UseBasicParsing -ErrorAction SilentlyContinue
$bad.Content
```

**Say:**
> "All endpoints have comprehensive input validation using express-validator. Invalid email, short password, missing fields — all caught with descriptive error messages and field names in the response."

---

## Scene 7: Pagination (8:30 – 9:30)

```powershell
# Paginated products
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/products?page=1&limit=3" -UseBasicParsing `
  | Select-Object -ExpandProperty Headers | Select-Object "X-Total-Count","X-Total-Pages","X-Page"
```

**Say:**
> "Pagination is implemented on all list endpoints. The response body remains a plain array for backward compatibility, while pagination metadata is in response headers: X-Total-Count, X-Page, X-Limit, X-Total-Pages."

---

## Scene 8: Full E2E Test (9:30 – 10:00)

```powershell
.\test-e2e.ps1
```

**Say:**
> "Running the complete end-to-end test suite. It covers: health check, registration, product listing, checkout, Saga completion, API composition, and rate limiting. All 7 scenarios pass."

**Expected:** `=== ALL TESTS PASSED ===`

---

**End of Demo 2**

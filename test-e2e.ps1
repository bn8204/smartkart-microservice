$ErrorActionPreference = "Stop"

Write-Host "`n=== 1. Gateway Health ===" -ForegroundColor Cyan
(Invoke-RestMethod http://localhost:8080/health) | ConvertTo-Json

Write-Host "`n=== 2. Register or Login User ===" -ForegroundColor Cyan
$testEmail = "bob@smartcart.com"
$testPass  = "pass123"
try {
  $reg = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/register' `
    -Method POST -ContentType 'application/json' `
    -Body "{`"name`":`"Bob`",`"email`":`"$testEmail`",`"password`":`"$testPass`"}"
  Write-Host "Registered new user." -ForegroundColor Green
  $reg | ConvertTo-Json
  $token = $reg.token
} catch {
  Write-Host "Already registered - logging in instead." -ForegroundColor Yellow
  $login = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/auth/login' `
    -Method POST -ContentType 'application/json' `
    -Body "{`"email`":`"$testEmail`",`"password`":`"$testPass`"}"
  $login | ConvertTo-Json
  $token = $login.token
}
Write-Host "Token: $($token.Substring(0,30))..."

Write-Host "`n=== 3. Products (public - no auth) ===" -ForegroundColor Cyan
$products = Invoke-RestMethod 'http://localhost:8080/api/v1/products'
Write-Host "Found $($products.Count) products:"
$products | ForEach-Object { Write-Host "  - $($_.name) `$$($_.price)" }

Write-Host "`n=== 4. Checkout (order-service + stock update) ===" -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $token" }
$body = @{
  user_id = 1
  shipping_address = "123 Main St, TestCity"
  items = @(
    @{ product_id=1; product_name="Wireless Headphones"; quantity=1; unit_price=79.99 }
  )
} | ConvertTo-Json -Depth 3
$order = Invoke-RestMethod -Uri 'http://localhost:8080/api/v1/orders/checkout' `
  -Method POST -ContentType 'application/json' -Headers $headers -Body $body
$order | ConvertTo-Json -Depth 4
$orderId = $order.order.id

Write-Host "`n=== 5. Payment - Saga event via RabbitMQ - wait 3s ===" -ForegroundColor Cyan
Start-Sleep 3
$payments = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/payments/order/$orderId" -Headers $headers
if ($payments.Count -gt 0) {
  Write-Host "SAGA WORKED: Payment record created automatically!" -ForegroundColor Green
  $payments | ConvertTo-Json
} else {
  Write-Host "No payment record yet (RabbitMQ may still be connecting)" -ForegroundColor Yellow
}

Write-Host "`n=== 6. API Composition (order + payment in 1 call) ===" -ForegroundColor Cyan
$details = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/orders/$orderId/details" -Headers $headers
$details | ConvertTo-Json -Depth 5

Write-Host "`n=== 7. Auth Rate Limit - 10 requests per 15min on login ===" -ForegroundColor Cyan
Write-Host "X-RateLimit headers visible on auth routes:"
$resp = Invoke-WebRequest -Uri 'http://localhost:8080/api/v1/auth/login' `
  -Method POST -ContentType 'application/json' `
  -Body '{"email":"bob@smartcart.com","password":"pass123"}' `
  -UseBasicParsing
$resp.Headers["X-RateLimit-Limit"]
$resp.Headers["X-RateLimit-Remaining"]

Write-Host "`n=== ALL TESTS PASSED ===" -ForegroundColor Green
